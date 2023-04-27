export const OPENAPI_API_KEY = process.env.NEXT_PUBLIC_OPENAPI_API_KEY;

export const BASE_INPUT_MODEL_PROMPT_JSON = `
generate a schema to track software bugs

{
  "schema":{
    "name" : "Bug",
    "title" : "Bug"    
  },
  "fields": [
    {
        "name" : "title",
        "title" : "Title",
        "type"  : "text",
        "required" : true
    },
    {
        "name" : "description",
        "title" : "Description",
        "type" : "multi-text"        
    },
    {
        "name" : "completed",
        "title" : "Completed",
        "type" : "boolean"        
    },
    {
        "name" : "reportedAt",
        "title" : "Reported at",
        "type" : "date"        
    },
    {
        "name" : "priority",
        "title" : "Priority",
        "type"  : "list",
        "required" : true,
        "options" : ["High","Medium","Low"],
        "defaultValue" : "Medium"
    },
    {
        "name" : "companiesEnvolved",
        "title" : "Companies Envolved",
        "type" : "related",
        "relatedSchema" : "Company",
        "relationType" : "hasMany"
    }
  ]
}
`;

export const BASE_INPUT_MODEL_PROMPT_YAML = `
generate a schema for users.

schema:
      name:   "User"
      title:  "User"

fields:
    -
      name: "name"
      title: "Name"
      type:  "text"
      required:  true
    -
      name: "email"
      title: "Email address"
      type:  "text"
      required:  true
      unique:  true
    -
      name: "role"
      title: "Role"
      type:  "list"
      options:  ["USER", "ADMIN"]
      default: "USER"      
    -
      name: "password"
      title: "Password"
      type:  "related"
      relatedSchema: "Password"
      relationType: "hasMany"    
`;

export const OPERATION_GPT_TEXT_YAML = `
Note: All filters parameters are taken from Mongoose filter options

Search top 5 users whose age is greater than 20 or name matches "man"

response:
    type: "SEARCH"
    params:
        filter:
            firstName: 
                $regex: "man"
                $options: "i"
            lastName: 
                $regex: "man"                
                $options: "i"
            
            age:
                $gt: 20
            
        limit: 5
        skip: 0
        sort:
            firstName: 1 

Add some dummy data to users schema
request:
    query: "Add some dummy data to users schema"
response:
    type: "CREATE"

Add some dummy data to the schema
response:
    type: "CREATE"

Update those users' role to "MANAGER" whose roles are either "USER or "ADMIN"
response:
    type: "UPDATE"
    params:
        filter:
            roles:
                $in:
                    - "USER"
                    - "ADMIN"                

    update:
        role:"MANAGER"

    updateType: "many"


Update a user's first name to "Mark", last name to "Thomas Henry" whose name matches "Mark Henry" and age is greater than 26 

response:
    type: "UPDATE"
    params:
        filter:
            firstName: 
                $regex: "Mark"
                $options: "i"
            lastName: 
                $regex: "Henry"                
                $options: "i"
        
            age:
                $gt: 26        

    update:
        firstName: "Mark"
        lastName: "Thomas Henry"

    updateType: "single"
    
`;

export const MIND_MAP_PROMPT_HELPER = `
create a mind map for organization structure

---
class: 'go.TreeModel'
nodeDataArray:
  - key: '0'
    text: 'Organization'
    loc: '0 0'
  - key: '0-0'
    parent: '0'
    text: 'Mission'
    brush: 'skyblue'
    dir: 'right'
    loc: '77 -22'
  - key: '0-1'
    parent: '0'
    text: 'Vision'
    brush: 'skyblue'
    dir: 'right'
    loc: '200 -48'
  - key: '0-2'
    parent: '0'
    text: 'Values'
    brush: 'skyblue'
    dir: 'right'
    loc: '200 -22'
  - key: '0-3'
    parent: '0'
    text: 'Structure'
    brush: 'skyblue'
    dir: 'right'
    loc: '200 4'
  - key: '0-3-0'
    parent: '0-3'
    text: 'Teams'
    brush: 'skyblue'
    dir: 'right'
    loc: '77 43'
  - key: '0-4'
    parent: '0'
    text: 'Planning'
    brush: 'darkseagreen'
    dir: 'right'
    loc: '203 30'
  - key: '0-4-0'
    parent: '0-4'
    text: 'Board of Directors'
    brush: 'darkseagreen'
    dir: 'right'
    loc: '274 17'
  - key: '0-4-1'
    parent: '0-4'
    text: 'Executive Team'
    brush: 'darkseagreen'
    dir: 'right'
    loc: '274 43'
  - key: '0-5'
    parent: '0'
    text: 'Process'
    brush: 'darkseagreen'
    dir: 'right'
    loc: '203 56'
  - key: '0-5-0'
    parent: '0-5'
    text: 'Onboarding'
    brush: 'palevioletred'
    dir: 'left'
    loc: '-20 -31.75'
  - key: '0-5-1'
    parent: '0-5'
    text: 'Performance Management'
    brush: 'palevioletred'
    dir: 'left'
    loc: '-117 -64.25'
  - key: '0-5-2'
    parent: '0-5'
    text: 'Decision-making'
    brush: 'palevioletred'
    dir: 'left'
    loc: '-117 -25.25'
  - key: '0-6'
    parent: '0'
    text: 'Culture'
    brush: 'palevioletred'
    dir: 'left'
    loc: '-117 0.75'
  - key: '0-6-0'
    parent: '0-6'
    text: 'Communication'
    brush: 'palevioletred'
    dir: 'left'
    loc: '-251 -77.25'
  - key: '0-6-1'
    parent: '0-6'
    text: 'Collaboration'
    brush: 'palevioletred'
    dir: 'left'
    loc: '-251 -51.25'
  - key: '0-7'
    parent: '0'
    text: 'Environment'
    brush: 'coral'
    dir: 'left'
    loc: '-20 52.75'
  - key: '0-7-0'
    parent: '0-7'
    text: 'Physical'
    brush: 'coral'
    dir: 'left'
    loc: '-103 26.75'
  - key: '0-7-1'
    parent: '0-7'
    text: 'Digital'
    brush: 'coral'
    dir: 'left'
    loc: '-103 52.75'
`;
// export const MIND_MAP_PROMPT_HELPER = `
// create a mind map for vacation planning to london

// ---
// -
//     id: '0'
//     topic: 'London Vacation Planning'
//     style: null
//     parent: null
//     children:
//     -
//         id: '0-0'
//         topic: 'Transportation'
//         parent: '0'
//     -
//         id: '0-1'
//         topic: 'Accommodation'
//         parent: '0'
//     -
//         id: '0-2'
//         topic: 'Sightseeing'
//         parent: '0'
//     -
//         id: '0-3'
//         topic: 'Food and Drink'
//         parent: '0'
//     -
//         id: '0-4'
//         topic: 'Entertainment'
//         parent: '0'
//     -
//         id: '0-5'
//         topic: 'Shopping'
//         parent: '0'
// `;
