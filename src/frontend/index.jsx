import React, { useEffect, useState } from "react";
import ForgeReconciler, {
  Text,
  Stack,
  Spinner,
  SectionMessage,
} from "@forge/react";
import { invoke } from "@forge/bridge";

import ScoreHeader from "./components/ScoreHeader";
import ProgressSection from "./components/ProgressSection";
import NeedsAttention from "./components/NeedsAttention";

const App = () => {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    invoke("getSprintHealth")
      .then(setData)
      .catch((err) => setError(err.message));
  }, []);

  if (error) {
    return (
      <SectionMessage appearance="error" title="Couldn't load sprint health">
        <Text>{error}</Text>
      </SectionMessage>
    );
  }

  if (!data) return <Spinner size="large" label="Loading sprint health" />;

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
