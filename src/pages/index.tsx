import React from 'react';
import Link from 'next/link';

import cx from 'classnames';

import Typography from '@mui/material/Typography';

import ViewInArOutlinedIcon from '@mui/icons-material/ViewInArOutlined';
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';
import PlayArrowOutlinedIcon from '@mui/icons-material/PlayArrowOutlined';

type HomePageProps = {};

const HomePage: React.FC<HomePageProps> = (props) => {
  const renderHomePage = () => {
    return (
      <main>
        <div className="h-screen w-screen flex items-center justify-center">
          <ul className="flex items-center gap-3">
            <li>
              <Typography
                component={Link}
                sx={{
                  ':hover': {
                    color: 'primary',
                  },
                }}
                href="/schemas"
              >
                <ViewInArOutlinedIcon />
                <span className="px-2">View Schemas</span>
              </Typography>
            </li>
            <li>
              <Typography
                component={Link}
                sx={{
                  ':hover': {
                    color: 'primary',
                  },
                }}
                href="/api-doc"
              >
                <DescriptionOutlinedIcon />
                <span className="px-2">View APIs docs</span>
              </Typography>
            </li>
            <li>
              <Typography
                component={Link}
                sx={{
                  ':hover': {
                    color: 'primary',
                  },
                }}
                href="/playground"
              >
                <PlayArrowOutlinedIcon />
                <span className="px-2">Playground</span>
              </Typography>
            </li>
          </ul>
        </div>
      </main>
    );
  };

  return renderHomePage();
};

export default HomePage;
