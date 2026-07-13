import mongoose from 'mongoose';

const QuoteSchema = new mongoose.Schema(
  {
    text: {
      type: String,
      required: true,
      unique: true
    },
    author: {
      type: String,
      default: 'Unknown'
    }
  },
  {
    timestamps: true
  }
);

const Quote = mongoose.model('Quote', QuoteSchema);
export default Quote;
