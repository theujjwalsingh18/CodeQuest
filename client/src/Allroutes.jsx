// import React from 'react'
// import { Routes, Route } from 'react-router-dom'
// import Home from './Pages/Home/Home'
// import Askquestion from './Pages/Askquestion/Askquestion'
// import Auth from './Pages/Auth/Auth'
// import Question from './Pages/Question/Question'
// import Displayquestion from './Pages/Question/Displayquestion'
// import Tags from './Pages/Tag/Tags'
// import Users from './Pages/Users/Users'
// import Userprofile from './Pages/UserProfile/UserProfile'
// import TimeRestriction from './Components/TimeRestriction'

// function Allroutes({ slidein, handleslidein }) {
//   return (
//     <TimeRestriction>
//       <Routes>
//         <Route path='/' element={<Home slidein={slidein} handleslidein={handleslidein} />} />
//         <Route path='/Askquestion' element={<Askquestion />} />
//         <Route path='/Auth' element={<Auth />} />
//         <Route path='/Question' element={<Question slidein={slidein} handleslidein={handleslidein} />} />
//         <Route path='/Question/:id' element={<Displayquestion slidein={slidein} handleslidein={handleslidein} />} />
//         <Route path='/Tags' element={<Tags slidein={slidein} handleslidein={handleslidein} />} />
//         <Route path='/Users' element={<Users slidein={slidein} handleslidein={handleslidein} />} />
//         <Route path='/Users/:id' element={<Userprofile slidein={slidein} handleslidein={handleslidein} />} />
//       </Routes >
//     </TimeRestriction>
//   )
// }

// export default Allroutes

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
