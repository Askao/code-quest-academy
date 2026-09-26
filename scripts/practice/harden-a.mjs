// Reference solutions + extra test inputs for the older practice pools.
// Each solution must pass the task's EXISTING tests (that is the check that the
// wording and the tests agree); the extra inputs get their expected output from it.
export const topics = {
  "getting-started": {
    "p-01": { solution: `name = input()\nprint(name)\nprint(name)`, extra: ["Sam", "Mia Rose"] },
    "p-02": { solution: `number = input()\nprint("Number: " + number)`, extra: ["7", "-12", "3.5"] },
    "p-03": { solution: `name = input()\noccasion = input()\nprint("Happy " + occasion + ", " + name + "!")`, extra: ["Sam\nBirthday", "Mia\nNew Year"] },
    "p-04": { solution: `item = input()\nlocation = input()\nprint(item)\nprint("Located at: " + location)`, extra: ["Pens\nAisle 4", "Milk\nFridge 2"] },
    "p-05": { solution: `name = input()\nhobby = input()\nprint(name + " enjoys " + hobby + ".")`, extra: ["Sam\nchess", "Mia\nswimming"] },
    "p-06": { solution: `number = input()\nstreet = input()\ncity = input()\nprint(number + " " + street + ", " + city)`, extra: ["12\nHigh Street\nLeeds", "7\nPark Road\nYork"] },
    "p-07": { solution: `name = input()\nplace = input()\nprint(name + " travelled to " + place + ".")\nprint(place + " welcomed " + name + " warmly.")`, extra: ["Sam\nParis", "Mia\nOslo"] },
    "p-08": { solution: `name = input()\ntitle = input()\nphone = input()\nprint(name)\nprint(title)\nprint("Call: " + phone)`, extra: ["Sam Lee\nChef\n07700 900111", "Mia\nPilot\n01632 960000"] },
    "p-09": { solution: `film = input()\nshowtime = input()\nseat = input()\nprint(film + " — " + showtime + " — Seat " + seat)`, extra: ["Up\n18:30\nB4", "Cars\n14:00\nC12"] },
    "p-10": { solution: `sender = input()\nreceiver = input()\nitem = input()\nquantity = input()\nprice = input()\nprint("From: " + sender + " To: " + receiver)\nprint("Item: " + item + " x" + quantity)\nprint("Total due: £" + price)`, extra: ["Sam\nMia\nlamp\n2\n19.99", "Ann\nBo\nbook\n1\n5"] },
    "p-s1": { solution: `name = input()\na1 = input()\na2 = input()\ncity = input()\npostcode = input()\ncountry = input()\nprint(name)\nprint(a1)\nprint(a2)\nprint(city + ", " + postcode)\nprint(country)`, extra: ["Sam Lee\n4 Oak Lane\nFlat 2\nBath\nBA1 1AA\nUK"] },
    "p-s2": { solution: `host = input()\nguest = input()\nevent = input()\ndate = input()\ntime = input()\nvenue = input()\nprint(guest + ", you're invited to " + event + "!")\nprint("Hosted by " + host + " at " + venue + ".")\nprint(date + " at " + time + ".")`, extra: ["Ann\nBo\nQuiz Night\n5 May\n7pm\nThe Hall"] },
  },
  fundamentals: {
    "p-01": { solution: `age = int(input())\nprint(f"My pet is {age} years old.")`, extra: ["3", "12", "0"] },
    "p-02": { solution: `price = float(input())\nprint(f"This book costs £{price}")`, extra: ["7.5", "12.99", "4"] },
    "p-03": { solution: `drink = float(input())\nsnack = float(input())\nprint(f"Total: £{drink + snack}")`, extra: ["1.5\n2.25", "2\n3", "0.5\n0.5"] },
    "p-04": { solution: `high = float(input())\nlow = float(input())\nprint(f"Swing: {high - low}")`, extra: ["21.5\n9.5", "10\n10", "15.5\n-2"] },
    "p-05": { solution: `total = float(input())\npeople = int(input())\nprint(f"Each pays: £{total / people}")`, extra: ["90\n3", "50\n4", "10\n1"] },
    "p-06": { solution: `bill = float(input())\ntip = int(input())\nprint(f"Total: £{bill + bill * tip / 100}")`, extra: ["50\n10", "80\n0", "40\n25"] },
    "p-07": { solution: `a = int(input())\nb = int(input())\nc = int(input())\nprint(f"Product: {a * b * c}")`, extra: ["2\n3\n4", "5\n0\n9", "-2\n3\n4"] },
    "p-08": { solution: `a = float(input())\nb = float(input())\nc = float(input())\ntotal = a + b + c\naverage = total / 3\nprint(f"Total: {total}")\nprint(f"Average: {average}")`, extra: ["1.5\n1.5\n1.5", "1.6\n1.8\n1.7"] },
    "p-09": { solution: `capacity = float(input())\ncurrent = float(input())\nneeded = capacity - current\npercent = current / capacity * 100\nprint(f"Needed: {needed}")\nprint(f"Percent full: {percent}%")`, extra: ["50\n25", "60\n60", "40\n10"] },
    "p-10": { solution: `name = input()\nmembership = int(input())\namount = float(input())\nrate = float(input())\nprint(f"Customer: {name} (#{membership})")\nprint("Converted: " + chr(36) + str(amount * rate))`, extra: ["Sam\n204\n100\n1.25", "Mia\n7\n20\n1.5"] },
    "p-s1": { solution: `bill = float(input())\npeople = int(input())\ntip_pct = int(input())\ntip = round(bill * tip_pct / 100, 2)\ntotal = round(bill + tip, 2)\nshare = round(total / people, 2)\nprint(f"Tip: £{tip}")\nprint(f"Total: £{total}")\nprint(f"Each pays: £{share}")`, extra: ["60\n4\n10", "45.5\n2\n20"] },
    "p-s2": { solution: `name1 = input()\nprice1 = float(input())\nqty1 = int(input())\nname2 = input()\nprice2 = float(input())\nqty2 = int(input())\nunit1 = round(price1 / qty1, 2)\nunit2 = round(price2 / qty2, 2)\nprint(f"{name1}: £{unit1} each")\nprint(f"{name2}: £{unit2} each")\nif unit1 < unit2:\n    print(f"Better value: {name1}")\nelse:\n    print(f"Better value: {name2}")`, extra: ["Cola\n3\n6\nJuice\n2\n4"] },
  },
};
