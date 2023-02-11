import React, { useRef, useState } from 'react';
import { useRouter } from 'next/router';

import moment from 'moment';

import CircularProgress from '@mui/material/CircularProgress';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';

import SendOutlinedIcon from '@mui/icons-material/SendOutlined';

import { useForm } from 'react-hook-form';

const OPENAPI_API_KEY = process.env.NEXT_PUBLIC_OPENAPI_API_KEY;

const INPUT_MODEL = `
generate a schema to track software bugs.

# Bug Schema

{
    "name:"Bug",
    "title":"Bug"    
}

# Bug Schema fields
[
    {
        "name" : "title",
        "title" : "Title",
        "type"  : "text",
        "required":true
    },
    {
        "name" : "description",
        "title" : "Description",
        "type": "multi-text"        
    },
    {
        "name" : "completed",
        "title" : "Completed",
        "type" : "boolean",        
    },
    {
        "name" : "reportedAt",
        "title" : "Reported at",
        "type" : "date",        
    },
    {
        "name" : "priority",
        "title" : "Priority",
        "type"  : "list",
        "required":true,
        "options": ["High","Medium","Low"],
        "defaultValue" : "Medium"
    },
    {
        "name" : "companiesEnvolved",
        "title" : "Companies Envolved",
        "type" : "related",
        "relationSchema" : "Company",
        "relationType" : "hasMany"
    }
]
`;

const getResults = async ({ text }: { text: string }) => {
  const payload = {
    model: 'text-davinci-003',
    temperature: 0,
    max_tokens: 1000,
    prompt: `${INPUT_MODEL}

    ${text}
    `,
  };

  const body = JSON.stringify(payload);

  const res = await fetch(`https://api.openai.com/v1/completions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${OPENAPI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body,
  });
  if (!res.ok) throw new Error();
  const data = await res.json();
  return data;
};

type PlaygroundPageProps = {};

const PlaygroundPage: React.FC<PlaygroundPageProps> = (props) => {
  const {} = props;

  const router = useRouter();

  const containerRef = useRef<any>(null);

  const [queries, setQueries] = useState<any[]>([]);
  const [choices, setChoices] = useState<any[]>([]);

  const { formState, watch, reset, register, handleSubmit } = useForm({});

  const { isSubmitting } = formState;

  const handlePlaygroundInputSubmit = async (values: any) => {
    try {
      const now = moment();
      const res = await getResults(values);
      if (res.choices && res.choices.length) {
        setQueries([
          ...queries,
          { text: values.text, createdAt: now.format('LLL') },
        ]);
        setChoices((prevResponses) => [...prevResponses, ...res.choices]);
        reset({ text: '' });
      }
    } catch (e) {
      console.log(`e->`, e);
    }
  };

  const renderPlaygroundPage = () => {
    return (
      <div className="h-screen w-screen overflow-hidden flex flex-col">
        <div
          className="flex flex-col flex-1 overflow-y-auto"
          ref={containerRef}
        >
          <ul className="p-6">
            {choices.map((choice, i) => {
              return (
                <li key={i} className="p-2 whitespace-pre">
                  <Typography component={'h3'} className="font-bold text-xl">
                    {queries[i].text}
                  </Typography>
                  <Typography className="text-sm">
                    {queries[i].createdAt}
                  </Typography>
                  <div>{choice.text}</div>
                </li>
              );
            })}
          </ul>
        </div>
        <form onSubmit={handleSubmit(handlePlaygroundInputSubmit)}>
          <div className="px-6 py-4">
            <div className="flex items-center rounded-full border border-gray overflow-hidden">
              <input
                placeholder="e.g. Create a schema to manage Customers"
                className="py-4 px-4 w-full bg-transparent outline-none"
                {...register('text', { required: 'true' })}
              />
              <div className="px-2">
                <IconButton
                  disabled={isSubmitting}
                  color="primary"
                  type="submit"
                >
                  {isSubmitting ? (
                    <CircularProgress size={16} />
                  ) : (
                    <SendOutlinedIcon />
                  )}
                </IconButton>
              </div>
            </div>
          </div>
        </form>
      </div>
    );
  };

  return renderPlaygroundPage();
};

export default PlaygroundPage;
