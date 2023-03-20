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
