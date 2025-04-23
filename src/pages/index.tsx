import React from 'react';

import Button from '@mui/material/Button';

import ViewInArOutlinedIcon from '@mui/icons-material/ViewInArOutlined';
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';
import PlayArrowOutlinedIcon from '@mui/icons-material/PlayArrowOutlined';
import AccountTreeOutlinedIcon from '@mui/icons-material/AccountTreeOutlined';

const items = [
  { title: 'View Schemas', icon: <ViewInArOutlinedIcon />, href: '/schemas' },
  {
    title: 'View API docs',
    icon: <DescriptionOutlinedIcon />,
    href: '/api-doc',
  },
  { title: 'Playground', icon: <PlayArrowOutlinedIcon />, href: '/playground' },
  { title: 'Mind Map', icon: <AccountTreeOutlinedIcon />, href: '/mind-map' },
];

const HomePage = () => {
  const renderHomePage = () => {
    return (
      <div className="h-screen w-screen flex items-center justify-center">
        <ul className="flex flex-col md:flex-row md:items-center gap-3">
          {items.map((item, i) => {
            return (
              <li key={i}>
                <Button
                  href={item.href}
                  startIcon={item.icon}
                  sx={{ borderRadius: 6, px: 2 }}
                >
                  {item.title}
                </Button>
              </li>
            );
          })}
        </ul>
      </div>
    );
  };

  return renderHomePage();
};

export default HomePage;
