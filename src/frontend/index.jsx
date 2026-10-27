import React, { useEffect, useState } from "react";
import ForgeReconciler, { Text } from "@forge/react";
import { invoke } from "@forge/bridge";

const App = () => {
  const [data, setData] = useState(null);
  useEffect(() => {
    invoke("getSprintHealth", { example: "my-invoke-variable" })
      .then((result) => {
        console.log(JSON.stringify(result, null, 2));
        setData(result);
      })
      .catch((err) => setData(`Error: ${err.message}`));
  }, []);
  return (
    <>
      <Text>{data ? JSON.stringify(data) : "Loading..."}</Text>
    </>
  );
};

ForgeReconciler.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
