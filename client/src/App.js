import { fetchallusers } from './Action/users';
import './App.css';
import { useEffect, useState } from 'react';
import Navbar from './Components/Navbar/Navbar';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Allroutes from './Allroutes'
import { useDispatch } from 'react-redux';
import { fetchallquestion } from './Action/question';

function App() {
  const [slidein, setslidein] = useState(true)
  const dispatch = useDispatch()
  
  useEffect(() => {
    dispatch(fetchallusers());
    dispatch(fetchallquestion());
  }, [dispatch])

  useEffect(() => {
    if (window.innerWidth <= 768) {
      setslidein(false)
    }
  }, [])
  
  const handleslidein = () => {
    if (window.innerWidth <= 768) {
      setslidein((state) => !state);
    }
  };

  return (
    <div className="App">
      <ToastContainer />
      <Navbar handleslidein={handleslidein} />
      <Allroutes slidein={slidein} handleslidein={handleslidein} />
    </div>
  );
}

export default App;