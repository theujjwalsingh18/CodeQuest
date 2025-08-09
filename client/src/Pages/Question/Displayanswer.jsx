import React from 'react'
import moment from 'moment'
import { Link, useParams } from 'react-router-dom'
import useToast from '../../hooks/useToast'
import Avatar from '../../Components/Avatar/Avatar'
import { useDispatch, useSelector } from 'react-redux'
import { deleteanswer, voteAnswer } from '../../Action/question'
import upvote from '../../assets/sort-up.svg'
import downvote from '../../assets/sort-down.svg'
import './Question.css'

const Displayanswer = ({ question, handleshare }) => {
  const { id: questionId } = useParams();
  const dispatch = useDispatch();
  const user = useSelector((state) => state.currentuserreducer);
  const { warningToast } = useToast();

  const handleVote = (answerId, value) => {
    if (user === null) {
      warningToast('Login or Signup to vote on answers');
    } else {
      dispatch(voteAnswer(questionId, answerId, value));
    }
  };

  const handledelete = (answerId) => {
    dispatch(deleteanswer(questionId, answerId));
  };

  return (
    <div>
      {question.answer.map((ans) => {
        const upvotes = ans.upvote || [];
        const downvotes = ans.downvote || [];

        const userId = user?.result?._id;
        const hasUpvoted = userId && upvotes.includes(userId);
        const hasDownvoted = userId && downvotes.includes(userId);
        const voteCount = upvotes.length - downvotes.length;
        const isOwnAnswer = user?.result?._id === ans.userid;
        const voteClass = isOwnAnswer ? 'disabled-vote' : '';

        return (
          <div className="display-ans" key={ans._id}>
            <div className="answer-votes">
              <img
                src={upvote}
                alt="Upvote"
                width={18}
                className={`votes-icon ${hasUpvoted ? 'active-vote' : ''} ${voteClass}`}
                onClick={isOwnAnswer ? null : () => handleVote(ans._id, 'upvote')}
                title={isOwnAnswer ? "You can't vote on your own answer" : ""}
              />
              <p>{voteCount}</p>
              <img
                src={downvote}
                alt="Downvote"
                width={18}
                className={`votes-icon ${hasDownvoted ? 'active-vote' : ''} ${voteClass}`}
                onClick={isOwnAnswer ? null : () => handleVote(ans._id, 'downvote')}
                title={isOwnAnswer ? "You can't vote on your own answer" : ""}
              />
            </div>
            <div className="answer-content">
              <p className='answer-body'>{ans.answerbody}</p>
              {ans.videoUrl && (
                <div className="answer-video">
                  <video controls width="100%" style={{ maxWidth: "400px" }}>
                    <source src={ans.videoUrl} type="video/mp4" />
                    Your browser does not support the video tag.
                  </video>
                </div>
              )}
              <div className="question-actions-user">
                <div>
                  <button type='button' onClick={handleshare} >Share</button>
                  {user?.result?._id === ans?.userid && (
                    <button type='button' onClick={() => handledelete(ans._id, question.noofanswers)}>Delete</button>
                  )}
                </div>
                <div>
                  <p>answered {moment(ans.answeredon).fromNow()}</p>
                  <Link to={`../Users/${ans.userid}`} className='user-link' style={{ color: "#0086d8" }}>
                    <Avatar backgroundColor="lightgreen" px="2px" py="2px" borderRadius="2px">
                      {ans.useranswered.charAt(0).toUpperCase()}
                    </Avatar>
                    <div>{ans.useranswered}</div>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

export default Displayanswer;