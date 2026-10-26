-- Placement tests show 3 answers plus "Skip this question". Older tests were written with 4: drop one wrong
-- answer from each (the last one that isn't correct), keeping the correct answer's index right.
-- Stored learner answers aren't read back (a retake replaces them), so past results are unaffected.
UPDATE "placement_question"
SET "options" = "options" - (CASE WHEN "answer_index" = 3 THEN 2 ELSE 3 END),
    "answer_index" = LEAST("answer_index", 2)
WHERE jsonb_array_length("options") = 4;
