import {React,  useState, useRef, useEffect } from 'react'
import { useSelector, useDispatch } from "react-redux"
import { Link, useNavigate, useParams } from 'react-router-dom'
import moment from 'moment'
import copy from "copy-to-clipboard"
import useToast from '../../hooks/useToast'
import upvote from "../../assets/sort-up.svg"
import downvote from "../../assets/sort-down.svg"
import './Question.css'
import Avatar from '../../Components/Avatar/Avatar'
import Displayanswer from './Displayanswer'
import { deletequestion, votequestion, postanswer } from '../../Action/question'

const Questiondetails = () => {
    const { successToast, errorToast, warningToast } = useToast();
    const [answer, setanswer] = useState("")
    const dispatch = useDispatch()
    const questionlist = useSelector((state) => state.questionreducer)
    const { id } = useParams();
    const user = useSelector((state) => state.currentuserreducer)
    const navigate = useNavigate()
    const videoRef = useRef(null);

    useEffect(() => {
        return () => {
            if (videoRef.current) {
                videoRef.current.pause();
                videoRef.current.removeAttribute('src');
                videoRef.current.load();
            }
        };
    }, []);

    const handlepostans = (e, answerlength) => {
        e.preventDefault();
        if (user === null) {
            errorToast("Login or Signup to answer a question")
            navigate('/Auth')
        } else {
            if (answer === "") {
                warningToast("Enter an answer before submitting")
            } else {
                dispatch(postanswer({
                    id,
                    noofanswers: answerlength + 1,
                    answerbody: answer,
                    userid: user.result._id,
                    useranswered: user.result.name
                }));
                setanswer("")
            }
        }
    }

    const handleshare = () => {
        copy(window.location.href);
        successToast("Copied url : " + window.location.href)
    }

    const handledelete = () => {
        dispatch(deletequestion(id, navigate))
    }

    const handleupvote = () => {
        if (user === null) {
            errorToast("Login or Signup to vote on questions")
            navigate('/Auth')
        } else {
            dispatch(votequestion(id, "upvote"))
        }
    }

    const handledownvote = () => {
        if (user === null) {
            errorToast("Login or Signup to vote on questions")
            navigate('/Auth')
        } else {
            dispatch(votequestion(id, "downvote"))
        }
    }

    return (
        <div className="question-details-page">
            {questionlist.data === null ? (
                <h1>Loading...</h1>
            ) : (
                <>
                    {questionlist.data.filter((question) => question._id === id).map((question) => {
                        const userId = user?.result?._id;

                        const hasUpvoted = userId && question.upvote.includes(userId);
                        const hasDownvoted = userId && question.downvote.includes(userId);
                        const voteCount = question.upvote.length - question.downvote.length;

                        return (
                            <div key={question._id}>
                                <section className='question-details-container'>
                                    <h1>{question.questiontitle}</h1>
                                    <div className="question-details-container-2">
                                        <div className="question-votes">
                                            <img
                                                src={upvote}
                                                alt="Upvote"
                                                width={18}
                                                className={`votes-icon ${hasUpvoted ? 'active-vote' : ''}`}
                                                onClick={handleupvote}
                                            />
                                            <p>{voteCount}</p>
                                            <img
                                                src={downvote}
                                                alt="Downvote"
                                                width={18}
                                                className={`votes-icon ${hasDownvoted ? 'active-vote' : ''}`}
                                                onClick={handledownvote}
                                            />
                                        </div>
                                        <div style={{ width: "100%" }}>
                                            <p className='question-body'>{question.questionbody}</p>
                                            {question.videoUrl && (
                                                <div className="video-container">
                                                    <video
                                                        ref={videoRef}
                                                        controls
                                                        preload="metadata"
                                                    >
                                                        <source src={question.videoUrl} type="video/mp4" />
                                                        Your browser does not support the video tag.
                                                    </video>
                                                </div>
                                            )}

                                            <div className="question-details-tags">
                                                {question.questiontags.map((tag) => (
                                                    <p key={tag}>{tag}</p>
                                                ))}
                                            </div>
                                            <div className="question-actions-user">
                                                <div>
                                                    <button type='button' onClick={handleshare}>
                                                        Share
                                                    </button>
                                                    {user?.result?._id === question?.userid && (
                                                        <button type='button' onClick={handledelete}>Delete</button>
                                                    )}
                                                </div>
                                                <div>
                                                    <p>Asked {moment(question.askedon).fromNow()}</p>
                                                    <Link to={`/Users/${question.userid}`} className='user-link' style={{ color: "#0086d8" }}>
                                                        <Avatar backgroundColor="orange" px="8px" py="5px" borderRadius="4px">
                                                            {question.userposted.charAt(0).toUpperCase()}
                                                        </Avatar>
                                                        <div>{question.userposted}</div>
                                                    </Link>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </section>
                                {question.noofanswers !== 0 && (
                                    <section>
                                        <h3>{question.noofanswers} Answers</h3>
                                        <Displayanswer key={question._id} question={question} handleshare={handleshare} />
                                    </section>
                                )}
                                <section className="post-ans-container">
                                    <h3>Your Answer</h3>
                                    <form onSubmit={(e) => {
                                        handlepostans(e, question.answer.length)
                                    }}>
                                        <textarea
                                            name=""
                                            id=""
                                            cols="30"
                                            rows="10"
                                            value={answer}
                                            onChange={(e) => setanswer(e.target.value)}
                                        ></textarea>
                                        <br />
                                        <input type="submit" className="post-ans-btn" value="Post your Answer" />
                                    </form>
                                    <p>Browse other Question tagged
                                        {question.questiontags.map((tag) => (
                                            <Link to="/Tags" key={tag} className='ans-tag'>
                                                {" "}
                                                {tag}{" "}
                                            </Link>
                                        ))}{" "}
                                        or
                                        <Link to="/Askquestion" style={{ textDecoration: "none", color: "#009dff" }}>
                                            {" "}
                                            Ask your own question
                                        </Link>
                                    </p>
                                </section>
                            </div>
                        )
                    })}
                </>
            )}
        </div>
    )
}

export default Questiondetails;