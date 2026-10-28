import React, { useEffect, useState } from "react";
import ForgeReconciler, {
  Text,
  Stack,
  Spinner,
  SectionMessage,
  Button,
} from "@forge/react";
import { invoke } from "@forge/bridge";

import ScoreHeader from "./components/ScoreHeader";
import ProgressSection from "./components/ProgressSection";
import NeedsAttention from "./components/NeedsAttention";

const ERROR_TEXT = {
  FORBIDDEN:
    "Sprint Health doesn't have permission to read this project. Ask a Jira admin to update the app.",
  BAD_REQUEST: "Jira couldn't run the sprint search.",
  NO_PROJECT_CONTEXT: "Open Sprint Health from a project's tab.",
  UNKNOWN: "Couldn't load sprint health.",
};

const App = () => {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  const load = () => {
    setError(null);
    setData(null);
    invoke("getSprintHealth")
      .then(setData)
      .catch((err) => setError(err.message));
  };

  useEffect(load, []);

  if (error) {
    return (
      <SectionMessage appearance="error" title="Couldn't load sprint health">
        <Stack space="space.100">
          <Text>{error}</Text>
          <Button onClick={load}>Retry</Button>
        </Stack>
      </SectionMessage>
    );
  }

  if (!data) return <Spinner size="large" label="Loading sprint health" />;

  if (data.error) {
    return (
      <SectionMessage appearance="error" title="Couldn't load sprint health">
        <Stack space="space.100">
          <Text>{ERROR_TEXT[data.error.code] ?? ERROR_TEXT.UNKNOWN}</Text>
          {data.error.code !== "FORBIDDEN" && (
            <Button onClick={load}>Retry</Button>
          )}
        </Stack>
      </SectionMessage>
    );
  }

  if (data.empty === "NO_ACTIVE_SPRINT") {
    return (
      <SectionMessage appearance="information" title="No active sprint">
        <Text>
          Start a sprint with work items in it from the Backlog to see its
          health.
        </Text>
      </SectionMessage>
    );
  }

  return (
    // space.300: sets 24px gap between the children of a Stack
    <Stack space="space.300">
      <ScoreHeader
        sprint={data.sprint}
        score={data.score}
        status={data.status}
        breakdown={data.breakdown}
        config={data.config}
      />
      {!data.config.estimatesEnabled && (
        <SectionMessage
          appearance="warning"
          title="Story points are not set up"
        >
          <Text>
            No story points field was found on this site, so estimate checks are
            off.
          </Text>
        </SectionMessage>
      )}
      <ProgressSection progress={data.progress} />
      <NeedsAttention flagged={data.flagged} />
    </Stack>
  );
};

ForgeReconciler.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
