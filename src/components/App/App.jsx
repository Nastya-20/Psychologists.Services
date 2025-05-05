import React, { Suspense } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import Loader from '../Loader/Loader';
import Navigation from '../Navigation/Navigation';
import { ToastContainer } from 'react-toastify';

const Home = React.lazy(() => import('../../pages/Home/Home'));
const Psychologists = React.lazy(() => import('../../pages/Psychologists/Psychologists'));
const Favorites = React.lazy(() => import('../../pages/Favorites/Favorites'));
const NotFoundPage = React.lazy(() => import('../../pages/NotFoundPage/NotFoundPage'));


export default function App() {
  const location = useLocation();

  return (
    <>
      {location.pathname !== '/notfound' && <Navigation />}
      <Suspense fallback={<Loader />}>
        <Routes>
          <Route extra path='/' element={<Home />} />
          <Route extra path='/psychologists' element={<Psychologists />} />
          <Route extra path='/favorites' element={<Favorites />} />

          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Suspense>
      <ToastContainer autoClose={1000} />
    </>
  );
}

