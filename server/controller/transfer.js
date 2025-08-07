import User from "../models/user.js";
import Transaction from "../models/transaction.js";

export const transferPoints = async (req, res) => {
  try {
    const { recipientId, amount } = req.body;
    const senderId = req.userid;

    if (!recipientId || !amount || amount < 1) {
      return res.status(400).json({ message: "Invalid request" });
    }

    if (senderId === recipientId) {
      return res.status(400).json({ message: "Cannot transfer to yourself" });
    }

    const sender = await User.findById(senderId);
    const recipient = await User.findById(recipientId);

    if (!sender || !recipient) {
      return res.status(404).json({ message: "User not found" });
    }

    if (sender.points <= 10) {
      return res.status(400).json({
        message: "Sender must have more than 10 points to transfer"
      });
    }

    if (sender.points < amount) {
      return res.status(400).json({ message: "Insufficient points" });
    }

    sender.points -= amount;
    recipient.points += amount;

    const transaction = new Transaction({
      sender: senderId,
      recipient: recipientId,
      amount
    });

    await Promise.all([
      sender.save(),
      recipient.save(),
      transaction.save()
    ]);

    res.status(200).json({
      success: true,
      message: "Transfer successful",
      updatedSender: {
        _id: sender._id,
        points: sender.points
      },
      updatedRecipient: {
        _id: recipient._id,
        points: recipient.points,
        name: recipient.name
      }
    });

  } catch (error) {
    res.status(500).json({ message: "Server error: " + error.message });
  }
};


export const getTransactionHistory = async (req, res) => {
  try {
    const userId = req.userid;

    const transactions = await Transaction.find({
      $or: [{ sender: userId }, { recipient: userId }]
    })
      .populate('sender', 'name')
      .populate('recipient', 'name')
      .sort({ timestamp: -1 });

    res.status(200).json(transactions);
  } catch (error) {
    res.status(500).json({ message: "Server error: " + error.message });
  }
};