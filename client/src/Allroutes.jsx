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
import TimeRestriction from './Components/TimeRestriction/TimeRestriction';

function Allroutes({ slidein, handleslidein }) {
  return (
    <Routes>
      <Route path='/' element={
        <TimeRestriction>
          <Home slidein={slidein} handleslidein={handleslidein} />
        </TimeRestriction>
      } />
      <Route path='/Askquestion' element={
        <TimeRestriction>
          <Askquestion />
        </TimeRestriction>
      } />
      <Route path='/Auth' element={
        <TimeRestriction>
          <Auth />
        </TimeRestriction>
      } />
      <Route path='/Question' element={
        <TimeRestriction>
          <Question slidein={slidein} handleslidein={handleslidein} />
        </TimeRestriction>
      } />
      <Route path='/Question/:id' element={
        <TimeRestriction>
          <Displayquestion slidein={slidein} handleslidein={handleslidein} />
        </TimeRestriction>
      } />
      <Route path='/Tags' element={
        <TimeRestriction>
          <Tags slidein={slidein} handleslidein={handleslidein} />
        </TimeRestriction>
      } />
      <Route path='/Users' element={
        <TimeRestriction>
          <Users slidein={slidein} handleslidein={handleslidein} />
        </TimeRestriction>
      } />
      <Route path='/Users/:id' element={
        <TimeRestriction>
          <Userprofile slidein={slidein} handleslidein={handleslidein} />
        </TimeRestriction>
      } />
    </Routes>
  )
}

export default Allroutes;
