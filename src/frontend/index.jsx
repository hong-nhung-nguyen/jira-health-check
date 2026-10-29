import React, { useEffect, useState } from "react";
import ForgeReconciler, {
  Text,
  Stack,
  Inline,
  Box,
  Spinner,
  SectionMessage,
  Button,
  EmptyState,
} from "@forge/react";
import { invoke } from "@forge/bridge";

import { pageStyle } from "./components/styles";
import SprintHeader from "./components/SprintHeader";
import HealthCard from "./components/HealthCard";
import ProgressCard from "./components/ProgressCard";
import NeedsAttention from "./components/NeedsAttention";

const ERROR_TEXT = {
  FORBIDDEN:
    "Sprint Health doesn't have permission to read this project. Ask a Jira admin to update the app.",
  BAD_REQUEST: "Jira couldn't run the sprint search.",
  NO_PROJECT_CONTEXT: "Open Sprint Health from a project's tab.",
  UNKNOWN: "Couldn't load sprint health.",
};

const Page = ({ children }) => <Box xcss={pageStyle}>{children}</Box>;

const ErrorMessage = ({ text, onRetry }) => (
  <SectionMessage appearance="error" title="Couldn't load sprint health">
    <Stack space="space.100">
      <Text>{text}</Text>
      {onRetry && <Button onClick={onRetry}>Retry</Button>}
    </Stack>
  </SectionMessage>
);

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

  const refresh = () => {
    invoke("getSprintHealth")
      .then(setData)
      .catch((err) => setError(err.message));
  };

  useEffect(load, []);

  // Order matters: each check makes the next one safe
  if (error)
    return (
      <Page>
        <ErrorMessage text={error} onRetry={load} />
      </Page>
    );

  if (!data)
    return (
      <Page>
        <Spinner size="large" label="Loading sprint health" />
      </Page>
    );

  if (data.error) {
    const { code } = data.error;
    return (
      <Page>
        <ErrorMessage
          text={ERROR_TEXT[code] ?? ERROR_TEXT.UNKNOWN}
          onRetry={code === "FORBIDDEN" ? null : load}
        />
      </Page>
    );
  }

  if (data.empty === "NO_ACTIVE_SPRINT") {
    return (
      <Page>
        <EmptyState
          header="No active sprint"
          description="Start a sprint with work items in it from the Backlog to see its health."
        />
      </Page>
    );
  }

  return (
    <Page>
      <Stack space="space.300">
        <SprintHeader sprint={data.sprint} />

        {!data.config.estimatesEnabled && (
          <SectionMessage
            appearance="warning"
            title="Story points aren't set up"
          >
            <Text>
              No story points field was found on this site, so estimate checks
              are off.
            </Text>
          </SectionMessage>
        )}

        <Inline space="space.200" alignBlock="stretch" shouldWrap>
          <HealthCard
            score={data.score}
            status={data.status}
            breakdown={data.breakdown}
          />
          <ProgressCard progress={data.progress} />
        </Inline>

        <NeedsAttention flagged={data.flagged} onChanged={refresh} />
      </Stack>
    </Page>
  );
};

ForgeReconciler.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
