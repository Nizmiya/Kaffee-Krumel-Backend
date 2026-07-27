import Counter from "../models/Counter.js";

export async function getNextSequence(name) {
  const counter = await Counter.findOneAndUpdate(
    { name },
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );
  return counter.seq;
}

export async function resetSequence(name, value = 0) {
  await Counter.findOneAndUpdate({ name }, { seq: value }, { upsert: true });
}
