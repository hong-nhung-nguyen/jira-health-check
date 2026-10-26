/**
 * + getProgress()
 * + getFlags()
 * + getFlaggedIssues()
 * + getScore()
 * + getStatus()
 */

export const getProgress = (issues) => {
  let todo = 0,
    inProgress = 0,
    done = 0;
  const totalPoints = issues.reduce((total, i) => total + (i.points ?? 0), 0);
  let donePoints = 0;

  for (const i of issues) {
    if (i.statusCategory === "done") {
      done++;
      donePoints += i.points ?? 0;
    } else if (i.statusCategory === "indeterminate") {
      inProgress++;
    } else {
      todo++;
    }
  }

  let percentDone;

  if (totalPoints > 0) {
    percentDone = Math.round((donePoints / totalPoints) * 100);
  } else {
    percentDone =
      issues.length > 0 ? Math.round((done / issues.length) * 100) : 0;
  }

  return {
    total: issues.length,
    done,
    inProgress,
    todo,
    points: { total: totalPoints, done: donePoints },
    percentDone,
  };
};
