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
