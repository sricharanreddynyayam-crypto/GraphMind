import json
import random

# 1. Define the Building Blocks
groups = ["Management", "Engineering", "Product", "Sales", "Legal"]
projects = ["Project Alpha", "Project Titan", "Project Apollo", "Project X"]
docs = ["NDA_Agreement", "Remote_Work_Policy", "Q4_Financials", "API_Spec_v2"]

nodes = []
links = []

# 2. Create People (Nodes)
people_ids = []
for i in range(30):
    group = random.choice(groups)
    person_id = f"Employee_{i+1}"
    people_ids.append(person_id)
    nodes.append({
        "id": person_id,
        "group": group,
        "type": "Person"
    })

# 3. Create Projects & Docs (Nodes)
for p in projects:
    nodes.append({"id": p, "group": "Project", "type": "Project"})
for d in docs:
    nodes.append({"id": d, "group": "Document", "type": "Document"})

# 4. Create Connections (The Web)
for person in people_ids:
    # Assign work to projects
    proj = random.choice(projects)
    links.append({"source": person, "target": proj, "value": "works_on"})
    
    # Randomly assign a manager
    if random.random() > 0.8:
        links.append({"source": "Employee_1", "target": person, "value": "manages"})

# Add specific hidden risks (The "GraphMind" Logic)
# Example: Project Titan requires an NDA, but Employee_5 (who works on it) hasn't signed it.
links.append({"source": "Project Titan", "target": "NDA_Agreement", "value": "requires_signed"})
links.append({"source": "Employee_1", "target": "NDA_Agreement", "value": "has_signed"}) 
# Notice we didn't link Employee_5 to the NDA. That's the bug we will find later!

data = {"nodes": nodes, "links": links}

# 5. Save to File
with open("data.json", "w") as f:
    json.dump(data, f, indent=2)

print("✅ data.json created successfully!")
