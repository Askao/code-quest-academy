-- ===== Roles =====
CREATE TYPE public.app_role AS ENUM ('admin','teacher','student');
CREATE TYPE public.track AS ENUM ('gcse','alevel');

CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text,
  full_name text NOT NULL DEFAULT 'Student',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

-- ===== Classes =====
CREATE TABLE public.classes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  track public.track NOT NULL DEFAULT 'gcse',
  join_code text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.classes TO authenticated;
GRANT ALL ON public.classes TO service_role;
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.class_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id uuid NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  joined_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (class_id, student_id)
);
GRANT SELECT, INSERT, DELETE ON public.class_members TO authenticated;
GRANT ALL ON public.class_members TO service_role;
ALTER TABLE public.class_members ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.is_class_teacher(_class_id uuid, _user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.classes WHERE id = _class_id AND teacher_id = _user_id)
$$;

CREATE OR REPLACE FUNCTION public.is_class_member(_class_id uuid, _user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.class_members WHERE class_id = _class_id AND student_id = _user_id)
$$;

-- can the viewer see this user's data?
CREATE OR REPLACE FUNCTION public.can_view_user(_viewer uuid, _target uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT _viewer = _target
     OR public.has_role(_viewer, 'admin')
     OR EXISTS (
          SELECT 1 FROM public.class_members cm
          JOIN public.classes c ON c.id = cm.class_id
          WHERE cm.student_id = _target AND c.teacher_id = _viewer)
     OR EXISTS (
          SELECT 1 FROM public.class_members a
          JOIN public.class_members b ON a.class_id = b.class_id
          WHERE a.student_id = _viewer AND b.student_id = _target)
     OR EXISTS (
          SELECT 1 FROM public.classes c
          JOIN public.class_members cm ON cm.class_id = c.id
          WHERE c.teacher_id = _target AND cm.student_id = _viewer)
$$;

CREATE POLICY "profiles readable by self, classmates, teachers, admins"
  ON public.profiles FOR SELECT TO authenticated USING (public.can_view_user(auth.uid(), id));
CREATE POLICY "own profile insert" ON public.profiles FOR INSERT TO authenticated WITH CHECK (id = auth.uid());
CREATE POLICY "own profile update" ON public.profiles FOR UPDATE TO authenticated USING (id = auth.uid()) WITH CHECK (id = auth.uid());

CREATE POLICY "roles readable" ON public.user_roles FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.can_view_user(auth.uid(), user_id));

CREATE POLICY "classes readable by teacher, members, admin" ON public.classes FOR SELECT TO authenticated
  USING (teacher_id = auth.uid() OR public.is_class_member(id, auth.uid()) OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "teachers create classes" ON public.classes FOR INSERT TO authenticated
  WITH CHECK (teacher_id = auth.uid() AND (public.has_role(auth.uid(),'teacher') OR public.has_role(auth.uid(),'admin')));
CREATE POLICY "teachers update own classes" ON public.classes FOR UPDATE TO authenticated
  USING (teacher_id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "teachers delete own classes" ON public.classes FOR DELETE TO authenticated
  USING (teacher_id = auth.uid() OR public.has_role(auth.uid(),'admin'));

CREATE POLICY "members readable" ON public.class_members FOR SELECT TO authenticated
  USING (student_id = auth.uid() OR public.is_class_teacher(class_id, auth.uid())
         OR public.is_class_member(class_id, auth.uid()) OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "students join classes" ON public.class_members FOR INSERT TO authenticated
  WITH CHECK (student_id = auth.uid() OR public.is_class_teacher(class_id, auth.uid()));
CREATE POLICY "leave or remove" ON public.class_members FOR DELETE TO authenticated
  USING (student_id = auth.uid() OR public.is_class_teacher(class_id, auth.uid()) OR public.has_role(auth.uid(),'admin'));

-- ===== Challenges =====
CREATE TABLE public.challenges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  title text NOT NULL,
  track public.track NOT NULL,
  topic text NOT NULL,
  difficulty int NOT NULL DEFAULT 1 CHECK (difficulty BETWEEN 1 AND 5),
  xp int NOT NULL DEFAULT 20,
  brief text NOT NULL,
  starter_code text NOT NULL DEFAULT '',
  hints jsonb NOT NULL DEFAULT '[]'::jsonb,
  tests jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.challenges TO authenticated;
GRANT ALL ON public.challenges TO service_role;
ALTER TABLE public.challenges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "challenges readable" ON public.challenges FOR SELECT TO authenticated USING (true);
CREATE POLICY "staff manage challenges" ON public.challenges FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'teacher'))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'teacher'));

-- ===== Skills =====
CREATE TABLE public.skills (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  track public.track NOT NULL,
  topic text NOT NULL,
  level numeric NOT NULL DEFAULT 1 CHECK (level >= 1 AND level <= 5),
  attempts int NOT NULL DEFAULT 0,
  passes int NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, track, topic)
);
GRANT SELECT, INSERT, UPDATE ON public.skills TO authenticated;
GRANT ALL ON public.skills TO service_role;
ALTER TABLE public.skills ENABLE ROW LEVEL SECURITY;
CREATE POLICY "skills readable" ON public.skills FOR SELECT TO authenticated USING (public.can_view_user(auth.uid(), user_id));
CREATE POLICY "own skills write" ON public.skills FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "own skills update" ON public.skills FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- ===== Attempts =====
CREATE TABLE public.attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  challenge_id uuid NOT NULL REFERENCES public.challenges(id) ON DELETE CASCADE,
  code text NOT NULL DEFAULT '',
  passed boolean NOT NULL DEFAULT false,
  tests_passed int NOT NULL DEFAULT 0,
  tests_total int NOT NULL DEFAULT 0,
  duration_ms int NOT NULL DEFAULT 0,
  xp_awarded int NOT NULL DEFAULT 0,
  mode text NOT NULL DEFAULT 'practice',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.attempts TO authenticated;
GRANT ALL ON public.attempts TO service_role;
ALTER TABLE public.attempts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "attempts readable" ON public.attempts FOR SELECT TO authenticated USING (public.can_view_user(auth.uid(), user_id));
CREATE POLICY "own attempts insert" ON public.attempts FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

-- ===== Stats & badges =====
CREATE TABLE public.stats (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  xp int NOT NULL DEFAULT 0,
  streak_days int NOT NULL DEFAULT 0,
  best_streak int NOT NULL DEFAULT 0,
  last_active date,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.stats TO authenticated;
GRANT ALL ON public.stats TO service_role;
ALTER TABLE public.stats ENABLE ROW LEVEL SECURITY;
CREATE POLICY "stats readable" ON public.stats FOR SELECT TO authenticated USING (public.can_view_user(auth.uid(), user_id));
CREATE POLICY "own stats insert" ON public.stats FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "own stats update" ON public.stats FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE TABLE public.badges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  badge_key text NOT NULL,
  earned_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, badge_key)
);
GRANT SELECT, INSERT ON public.badges TO authenticated;
GRANT ALL ON public.badges TO service_role;
ALTER TABLE public.badges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "badges readable" ON public.badges FOR SELECT TO authenticated USING (public.can_view_user(auth.uid(), user_id));
CREATE POLICY "own badges insert" ON public.badges FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

-- ===== Homework =====
CREATE TABLE public.homework (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id uuid NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  title text NOT NULL,
  instructions text NOT NULL DEFAULT '',
  challenge_ids uuid[] NOT NULL DEFAULT '{}',
  due_at timestamptz,
  adaptive boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.homework TO authenticated;
GRANT ALL ON public.homework TO service_role;
ALTER TABLE public.homework ENABLE ROW LEVEL SECURITY;
CREATE POLICY "homework readable" ON public.homework FOR SELECT TO authenticated
  USING (public.is_class_teacher(class_id, auth.uid()) OR public.is_class_member(class_id, auth.uid()) OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "teacher manages homework" ON public.homework FOR ALL TO authenticated
  USING (public.is_class_teacher(class_id, auth.uid()) OR public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.is_class_teacher(class_id, auth.uid()) OR public.has_role(auth.uid(),'admin'));

-- ===== Duels =====
CREATE TABLE public.duels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id uuid REFERENCES public.classes(id) ON DELETE CASCADE,
  challenge_id uuid NOT NULL REFERENCES public.challenges(id) ON DELETE CASCADE,
  challenger_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  opponent_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'open',
  challenger_ms int,
  opponent_ms int,
  winner_id uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.duels TO authenticated;
GRANT ALL ON public.duels TO service_role;
ALTER TABLE public.duels ENABLE ROW LEVEL SECURITY;
CREATE POLICY "duels readable" ON public.duels FOR SELECT TO authenticated
  USING (challenger_id = auth.uid() OR opponent_id = auth.uid()
         OR (class_id IS NOT NULL AND (public.is_class_teacher(class_id, auth.uid()) OR public.is_class_member(class_id, auth.uid())))
         OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "create duel" ON public.duels FOR INSERT TO authenticated WITH CHECK (challenger_id = auth.uid());
CREATE POLICY "update own duel" ON public.duels FOR UPDATE TO authenticated
  USING (challenger_id = auth.uid() OR opponent_id = auth.uid())
  WITH CHECK (challenger_id = auth.uid() OR opponent_id = auth.uid());

-- ===== App settings (admin only) =====
CREATE TABLE public.app_settings (
  key text PRIMARY KEY,
  value jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.app_settings TO authenticated;
GRANT ALL ON public.app_settings TO service_role;
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin only settings" ON public.app_settings FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- ===== Signup trigger =====
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  wanted text;
  assigned public.app_role;
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(COALESCE(NEW.email,'student'), '@', 1)));

  INSERT INTO public.stats (user_id) VALUES (NEW.id);

  wanted := COALESCE(NEW.raw_user_meta_data->>'role', 'student');

  IF NOT EXISTS (SELECT 1 FROM public.user_roles WHERE role = 'admin') THEN
    assigned := 'admin';
  ELSIF wanted = 'teacher' THEN
    assigned := 'teacher';
  ELSE
    assigned := 'student';
  END IF;

  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, assigned);
  IF assigned = 'admin' THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'teacher') ON CONFLICT DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();