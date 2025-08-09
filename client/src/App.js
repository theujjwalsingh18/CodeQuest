import { fetchallusers } from './Action/users';
import './App.css';
import { useEffect, useState } from 'react';
import Navbar from './Components/Navbar/Navbar';
import { Toaster } from 'sonner';
import Allroutes from './Allroutes'
import { useDispatch } from 'react-redux';
import { fetchallquestion } from './Action/question';
import { useLocation } from 'react-router-dom';

function App() {
  const [slidein, setslidein] = useState(true)
  const dispatch = useDispatch()
  const location = useLocation();

  useEffect(() => {
    dispatch(fetchallusers());
    dispatch(fetchallquestion());
  }, [dispatch])

  useEffect(() => {
    if (window.innerWidth <= 768) {
      setslidein(false);
    }
  }, [location.pathname]);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth <= 768) {
        setslidein(false);
      } else {
        setslidein(true);
      }
    };
    
    handleResize();
    window.addEventListener('resize', handleResize);
    
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleslidein = (shouldClose = false) => {
    if (window.innerWidth <= 768) {
      if (shouldClose) {
        setslidein(false);
      } else {
        setslidein(prevState => !prevState);
      }
    }
  };

  return (
    <div className="App">
      <Toaster
        position="top-right"
        richColors
        duration={2000}
        toastOptions={{
          style: {
            padding: '15px 25px',
            fontSize: '1rem',
          },
        }}
      />
      <Navbar handleslidein={handleslidein} />
      <Allroutes slidein={slidein} handleslidein={handleslidein} />
    </div>
  );
}

export default App;