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
    
meta:
  name: 'Organization Hierarchy'
  author: 'bhawanishiv@gmail.com'
  version: '0.2'
  
format: 'node_tree'
data: 
  id: 'root'
  topic: 'Organization'
  children: 
      -
          id: '0-0'
          topic: 'Mission'     
      -
          id: '0-1'
          topic: 'Vision'     
      
      -
          id: '0-2'
          topic: 'Values'     
    
      -
          id: '0-3'
          topic: 'Structure'     
          children:
              -
                  id: '0-3-0'
                  topic: 'Teams'
      
      -   
          id: '0-4'
          topic: 'Leadership'
          children:
              -
                  id: '0-4-0'
                  topic: 'Board of Directors'
              
              -
                  id: '0-4-1'
                  topic: 'Executive Team'
      
      -
          id: '0-5'
          topic: 'Processes'
          children:
              -
                  id: '0-4-0'
                  topic: 'Onboarding'
              
              -
                  id: '0-4-1'
                  topic: 'Performance Management'
              -   
                  id: '0-4-2'
                  topic: 'Decision-making'
      -   
          id: '0-6'
          topic: 'Culture'
          children:
              -
                  id: '0-6-0'
                  topic: 'Communication'
              
              -
                  id: '0-6-1'
                  topic: 'Collaboration'
              -   
                  id: '0-6-2'
                  topic: 'Innovation'
      
      -   
          id: '0-7'
          topic: 'Environment'
          children:
              -
                  id: '0-7-0'
                  topic: 'Physical'
              
              -
                  id: '0-7-1'
                  topic: 'Digital'
              
        
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
