import React from 'react'
import { Routes, Route } from 'react-router-dom'
import Home from './Pages/Home/Home'
import Askquestion from './Pages/Askquestion/Askquestion'
import Auth from './Pages/Auth/Auth'
import Question from './Pages/Question/Question'
import Displayquestion from './Pages/Question/Displayquestion'
import Tags from './Pages/Tag/Tags'
import Users from './Pages/Users/Users'
import Userprofile from './Pages/UserProfile/UserProfile'

const Allroutes = (slidein, handleSlidein) => {
  return (
    <Routes>
      <Route path='/' element={<Home slidein={slidein} handleslidein={handleSlidein} />} />
      <Route path='/Askquestion' element={<Askquestion />} />
      <Route path='/Auth' element={<Auth />} />
      <Route path='/Question' element={<Question slidein={slidein} handleslidein={handleSlidein} />} />
      <Route path='/Question/:id' element={<Displayquestion slidein={slidein} handleslidein={handleSlidein} />} />
      <Route path='/Tags' element={<Tags slidein={slidein} handleslidein={handleSlidein} />} />
      <Route path='/Users' element={<Users slidein={slidein} handleslidein={handleSlidein} />} />
      <Route path='/Users/:id' element={<Userprofile slidein={slidein} handleslidein={handleSlidein} />} />
    </Routes>
  )
}

export default Allroutes
