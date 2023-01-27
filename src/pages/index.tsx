import React from 'react';
import Link from 'next/link';

import cx from 'classnames';

type HomePageProps = {};

const HomePage: React.FC<HomePageProps> = (props) => {
  const renderHomePage = () => {
    return (
      <main className="app__container">
        <div>
          <ul>
            <li>
              <Link href="/schemas">Schemas</Link>
            </li>
            <li>
              <Link href="/users">Users</Link>
            </li>
          </ul>
        </div>
      </main>
    );
  };

  return renderHomePage();
};

export default HomePage;
