"use client";

import { useUser } from "@clerk/nextjs";
import {
  Call,
  MemberRequest,
  useStreamVideoClient,
} from "@stream-io/video-react-sdk";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { getUserIds } from "./action";

export default function CreateMeetingPage() {
  const [descriptionInput, setDescriptionInput] = useState("");
  const [startTimeInput, setStartTimeInput] = useState("");
  const [participantsInput, setParticipantsInput] = useState("");

  const [call, setCall] = useState<Call>();

  const client = useStreamVideoClient();
  const { user } = useUser();

  async function createMeeting() {
    if (!client || !user) return;

    try {
      const id = crypto.randomUUID();

      const callType = participantsInput ? "private-meeting" : "default";

      const call = client.call(callType, id);

      const memberEmails = participantsInput
        .split(",")
        .map((email) => email.trim());

      const memberIds = await getUserIds(memberEmails);

      const members: MemberRequest[] = memberIds
        .map((id) => ({
          user_id: id,
          role: "call_member",
        }))
        .concat({
          user_id: user.id,
          role: "call_member",
        })
        .filter(
          (v, i, a) => a.findIndex((v2) => v2.user_id === v.user_id) === i,
        );

      await call.getOrCreate({
        data: {
          custom: {
            members,
            description: descriptionInput,
          },
        },
      });
      setCall(call);
    } catch (error) {
      console.error(error);
      alert("Something went wrong. Please try again later");
    }
  }

  if (!client || !user) {
    return <Loader2 className="mx-auto animate-spin" />;
  }

  return (
    <div className="flex flex-col items-center space-y-6">
      <h1 className="text-center text-2xl font-bold">
        Welcome {user.username}
      </h1>
      <div className="mx-auto w-80 space-y-6 rounded-md bg-slate-100 p-5">
        <h2 className="text-xl font-bold">Create a new meeting</h2>
        <DescriptionInput
          value={descriptionInput}
          onChange={setDescriptionInput}
        />
        <StartTimeInput value={startTimeInput} onChange={setStartTimeInput} />
        <ParticipantsInput
          value={participantsInput}
          onChange={setParticipantsInput}
        />
        <button className="w-full" onClick={createMeeting}>
          Create meeting
        </button>
      </div>
      {call && <MeetingLink call={call} />}
    </div>
  );
}

interface DescriptionInputProps {
  value: string;
  onChange: (value: string) => void;
}

function DescriptionInput({ value, onChange }: DescriptionInputProps) {
  const [active, setActive] = useState(false);

  return (
    <div className="space-y-2">
      <div className="font-medium">Meeting info:</div>
      <label className="flex items-center gap-1.5">
        <input
          type="checkbox"
          checked={active}
          onChange={(e) => {
            setActive(e.target.checked);
            onChange("");
          }}
        />
        Add Description
      </label>
      {active && (
        <label className="block space-y-1">
          <span className="font-medium">Description</span>
          <textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            maxLength={500}
            className="w-full rounded-md border border-gray-300 p-2"
          ></textarea>
        </label>
      )}
    </div>
  );
}

interface StartTimeInputProps {
  value: string;
  onChange: (value: string) => void;
}

const StartTimeInput = ({ value, onChange }: StartTimeInputProps) => {
  const [active, setActive] = useState(false);

  const dateTimeLocalNow = new Date(
    new Date().getTime() - new Date().getTimezoneOffset() * 60_000,
  )
    .toISOString()
    .slice(0, 16);

  return (
    <div className="space-y-2">
      <div className="font-medium">Meeting start:</div>
      <label className="flex items-center gap-1.5">
        <input
          type="radio"
          checked={!active}
          onChange={() => {
            setActive(false);
            onChange("");
          }}
        />
        Start meeting immediately
      </label>

      <label className="flex items-center gap-1.5">
        <input
          type="radio"
          checked={active}
          onChange={() => {
            setActive(true);
            onChange(dateTimeLocalNow);
          }}
        />
        Start meeting at date/time
      </label>
      {active && (
        <label className="block space-y-1">
          <span className="font-medium">Start Time</span>
          <input
            type="datetime-local"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            min={dateTimeLocalNow}
            className="w-full rounded-md border border-gray-300 p-2"
          />
        </label>
      )}
    </div>
  );
};

interface ParticipantsInputProps {
  value: string;
  onChange: (value: string) => void;
}

const ParticipantsInput = ({ value, onChange }: ParticipantsInputProps) => {
  const [active, setActive] = useState(false);

  return (
    <div className="space-y-2">
      <div className="font-medium">Participants:</div>
      <label className="flex items-center gap-1.5">
        <input
          type="radio"
          checked={!active}
          onChange={() => {
            setActive(false);
            onChange("");
          }}
        />
        Everyone with link can join
      </label>
      <label className="flex items-center gap-1.5">
        <input
          type="radio"
          checked={active}
          onChange={() => {
            setActive(true);
          }}
        />
        Private meeting
      </label>
      {active && (
        <label className="block space-y-1">
          <span>Participant emails</span>
          <textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Enter participant email addresses separated by commas"
            className="w-full rounded-md border border-gray-300 p-2"
          />
        </label>
      )}
    </div>
  );
};

interface MeetingLinkProps {
  call: Call;
}

function MeetingLink({ call }: MeetingLinkProps) {
  const meetingLink = `${process.env.NEXT_PUBLIC_BASE_URL}/meeting/${call.id}`;

  return <div className="text-center">{meetingLink}</div>;
}
