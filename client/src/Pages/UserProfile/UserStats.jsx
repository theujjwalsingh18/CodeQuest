import { React, useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { transferPoints } from '../../Action/transfer';
import question from "../../assets/question_gif.gif";
import answer from "../../assets/answer_gif.gif";
import medal from "../../assets/medal.gif";
import "./UserStats.css";

const UserStats = ({ user: profileUser }) => {
  const dispatch = useDispatch();

  const currentUserPoints = useSelector(state =>
    state.currentuserreducer?.result?.points || 0
  );

  const currentUserId = useSelector(state =>
    state.currentuserreducer?.result?._id
  );

  const [showTransfer, setShowTransfer] = useState(false);
  const [transferAmount, setTransferAmount] = useState(1);
  const [isTransferring, setIsTransferring] = useState(false);
  const [transferError, setTransferError] = useState(null);
  const [transferSuccess, setTransferSuccess] = useState(false);

  const isOwnProfile = currentUserId === profileUser?._id;
  const hasSufficientPoints = currentUserPoints > 10;
  const canSharePoints = !isOwnProfile && hasSufficientPoints;

  useEffect(() => {
    if (!showTransfer) {
      setTransferAmount(1);
      setTransferError(null);
      setTransferSuccess(false);
    }
  }, [showTransfer]);


  useEffect(() => {
    if (transferAmount > currentUserPoints || currentUserPoints === 0) {
      setTransferAmount(Math.max(1, currentUserPoints));
    }
    if (currentUserPoints > 0 && transferAmount < 1) {
      setTransferAmount(1);
    }
  }, [currentUserPoints]);


  const handleTransfer = async () => {
    setIsTransferring(true);
    setTransferError(null);
    setTransferSuccess(false);
    try {
      const result = await dispatch(transferPoints({
        recipientId: profileUser._id,
        amount: transferAmount
      }));

      if (result?.success) {
        setTransferSuccess(true);
        setTimeout(() => {
          setTransferSuccess(false);
          setShowTransfer(false);
          setTransferAmount(1);
        }, 3000);
      } else {
        setTransferError(result?.message || 'Transfer failed');
      }
    } catch (error) {
      setTransferError('Error processing transfer');
    } finally {
      setIsTransferring(false);
    }
  };

  const handleSliderChange = (e) => {
    setTransferAmount(parseInt(e.target.value));
  };

  const percentage = Math.min(100, Math.max(0,
    (transferAmount / (currentUserPoints || 1)) * 100
  ));

  return (
    <div className="user-stats">
      <div className="stats-row">
        <div className="stat-card question-card">
          <div className="stat-icon">
            <img src={question} alt="Questions" className="stat-gif" />
          </div>
          <div className="stat-value">{profileUser.questionCount || 0}</div>
          <div className="stat-label">Questions</div>
        </div>

        <div className="stat-card answer-card">
          <div className="stat-icon">
            <img src={answer} alt="Answers" className="stat-gif" />
          </div>
          <div className="stat-value">{profileUser.answerCount || 0}</div>
          <div className="stat-label">Answers</div>
        </div>

        <div className="stat-card points-card">
          <div className="stat-icon">
            <img src={medal} alt="Points" className="stat-gif" />
          </div>
          <div className="stat-value">{profileUser.points || 0}</div>
          <div className="stat-label">Points</div>
        </div>
      </div>

      {canSharePoints && !showTransfer && (
        <button
          onClick={() => setShowTransfer(true)}
          className="share-points-btn"
        >
          <i className="fas fa-gift"></i> Share Your Points
          with {profileUser.name.split(' ')[0]}
        </button>
      )}

      {!hasSufficientPoints && !isOwnProfile && (
        <div className="points-warning">
          {currentUserPoints === 0 ? "" :
            `You need more than 10 points to share with others (you have ${currentUserPoints})`}
        </div>
      )}

      {showTransfer && hasSufficientPoints && (
        <div className="transfer-section">
          <div className="transfer-header">
            <h3>
              <i className="fas fa-exchange-alt"></i> Share
              Points with {profileUser.name}
            </h3>
            <button
              onClick={() => setShowTransfer(false)}
              className="close-transfer"
              aria-label="Close transfer panel"
            >
              &times;
            </button>
          </div>

          <div className="slider-container">
            <div className="slider-labels">
              <span>1 point</span>
              <span>{currentUserPoints} points (your balance)</span>
            </div>

            <div className="slider-wrapper">
              <input
                type="range"
                min="1"
                max={currentUserPoints || 1}
                value={transferAmount}
                onChange={handleSliderChange}
                className="points-slider"
                aria-label="Select points to transfer"
              />
              <div className="slider-track">
                <div
                  className="slider-fill"
                  style={{ width: `${percentage}%` }}
                ></div>
                <div
                  className="slider-thumb"
                  style={{ left: `${percentage}%` }}
                ></div>
              </div>
            </div>
          </div>

          <button
            onClick={handleTransfer}
            disabled={isTransferring || transferAmount > currentUserPoints || transferAmount < 1}
            className={`transfer-btn ${isTransferring ? 'transferring' : ''}`}
          >
            {isTransferring ? (
              <>
                <span className="spinner"></span> Sharing...
              </>
            ) : (
              `Send ${transferAmount} ${transferAmount === 1 ? 'point' : 'points'}`
            )}
          </button>

          {transferError && (
            <div className="transfer-error">
              <i className="fas fa-exclamation-circle"></i>
              {transferError}
            </div>
          )}
          {transferSuccess && (
            <div className="transfer-success">
              <i className="fas fa-check-circle"></i>
              Successfully shared {transferAmount} {transferAmount === 1
                ? 'point' : 'points'}!
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default UserStats;