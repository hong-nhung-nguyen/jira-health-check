import React, { useEffect, useState } from "react";
import {
  Modal,
  ModalTransition,
  ModalHeader,
  ModalTitle,
  ModalBody,
  ModalFooter,
  Button,
  Select,
  Textfield,
  Label,
  Stack,
  Text,
  SectionMessage,
} from "@forge/react";
import { invoke } from "@forge/bridge";
import { parsePoints } from "../../lib/fix";

const SAVE_ERROR = {
  FORBIDDEN: "You don't have permission to edit this issue.",
  BAD_REQUEST:
    "Jira rejected the change. Check that Story point estimate is on this issue's edit screen.",
  UNKNOWN: "Couldn't save the change. Try again.",
};

const FixIssueModal = ({ issue, onClose, onSaved }) => {
  const needsAssignee = issue.flags.includes("unassigned");
  const needsPoints = issue.flags.includes("unestimated");

  const [users, setUsers] = useState([]);
  const [assignee, setAssignee] = useState(null); // {label, value}
  const [points, setPoints] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!needsAssignee) return;
    invoke("getAssignableUsers", { issueKey: issue.key })
      .then((res) =>
        res.error
          ? setError(SAVE_ERROR[res.error.code] ?? SAVE_ERROR.UNKNOWN)
          : setUsers(res.users),
      )
      .catch(() => setError(SAVE_ERROR.UNKNOWN));
  }, [issue.key, needsAssignee]);

  const pointsValue = parsePoints(points);
  const pointsInvalid = points !== "" && pointsValue == null;
  const canSave =
    !saving && !pointsInvalid && (assignee !== null || pointsValue !== null);

  const save = async () => {
    setSaving(true);
    setError(null);

    try {
      const res = await invoke("fixIssue", {
        issueKey: issue.key,
        accountId: assignee?.value ?? null,
        points: pointsValue,
      });
      if (res.error) {
        setError(SAVE_ERROR[res.error.code] ?? SAVE_ERROR.UNKNOWN);
        setSaving(false);
        return;
      }
      onSaved();
    } catch {
      setError(SAVE_ERROR.UNKNOWN);
      setSaving(false);
    }
  };

  return (
    <ModalTransition>
      <Modal onClose={onClose}>
        <ModalHeader>
          <ModalTitle>Fix {issue.key}</ModalTitle>
        </ModalHeader>
        <ModalBody>
          <Stack space="space.200">
            <Text>{issue.summary}</Text>
            {error && (
              <SectionMessage appearance="error">
                <Text>{error}</Text>
              </SectionMessage>
            )}

            {needsAssignee && (
              <Stack space="space.050">
                <Label labelFor="fix-assignee">Assignee</Label>
                <Select
                  inputId="fix-assignee"
                  placeholder="Choose a person"
                  options={users.map((u) => ({
                    label: u.displayName,
                    value: u.accountId,
                  }))}
                  value={assignee}
                  onChange={setAssignee}
                />
              </Stack>
            )}

            {needsPoints && (
              <Stack space="space.050">
                <Label labelFor="fix-points">Story point estimate</Label>
                <Textfield
                  id="fix-points"
                  type="number"
                  value={points}
                  onChange={(e) => setPoints(e.target.value)}
                />
                {pointsInvalid && (
                  <Text color="color.text.danger">
                    Enter 0 or a positive number.
                  </Text>
                )}
              </Stack>
            )}
          </Stack>
        </ModalBody>
        <ModalFooter>
          <Button appearance="subtle" onClick={onClose}>
            Cancel
          </Button>
          <Button appearance="primary" onClick={save} isDisabled={!canSave}>
            {saving ? "Saving..." : "Save"}
          </Button>
        </ModalFooter>
      </Modal>
    </ModalTransition>
  );
};

export default FixIssueModal;
