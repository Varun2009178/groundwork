"use client";

import { useState } from "react";
import StepSidebar from "@/components/StepSidebar";
import SchemaInput from "@/components/SchemaInput";
import SchemaReview from "@/components/SchemaReview";
import ContextExport from "@/components/ContextExport";
import { Schema } from "@/lib/types";

export default function AppPage() {
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);
  const [userInput, setUserInput] = useState("");
  const [parsedSchema, setParsedSchema] = useState<Schema | null>(null);
  const [generatedMarkdown, setGeneratedMarkdown] = useState("");
  const [cursorMarkdown, setCursorMarkdown] = useState("");
  const [copilotMarkdown, setCopilotMarkdown] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleParseSchema = async () => {
    setIsLoading(true);
    setError("");
    try {
      const res = await fetch("/api/parse-schema", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input: userInput }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Something went wrong.");
        return;
      }
      setParsedSchema(data.schema);
      setCurrentStep(2);
    } catch {
      setError("Failed to connect — is the server running?");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateContext = async () => {
    if (!parsedSchema) return;
    setIsLoading(true);
    setError("");
    try {
      const res = await fetch("/api/generate-context", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ schema: parsedSchema }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Something went wrong.");
        return;
      }
      setGeneratedMarkdown(data.content);
      setCursorMarkdown(data.cursor);
      setCopilotMarkdown(data.copilot);
      setCurrentStep(3);
    } catch {
      setError("Failed to generate context file.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = () => {
    setError("");
    setCurrentStep(1);
  };

  const handleStartOver = () => {
    setUserInput("");
    setParsedSchema(null);
    setGeneratedMarkdown("");
    setCursorMarkdown("");
    setCopilotMarkdown("");
    setError("");
    setCurrentStep(1);
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-subtle">
      <StepSidebar currentStep={currentStep} />
      <main className="flex-1 px-6 py-10 md:py-16">
        {currentStep === 1 && (
          <SchemaInput
            value={userInput}
            onChange={setUserInput}
            onSubmit={handleParseSchema}
            isLoading={isLoading}
            error={error}
          />
        )}
        {currentStep === 2 && parsedSchema && (
          <SchemaReview
            schema={parsedSchema}
            onEdit={handleEdit}
            onGenerate={handleGenerateContext}
            isLoading={isLoading}
            error={error}
          />
        )}
        {currentStep === 3 && (
          <ContextExport
            content={generatedMarkdown}
            cursorContent={cursorMarkdown}
            copilotContent={copilotMarkdown}
            schema={parsedSchema!}
            onStartOver={handleStartOver}
          />
        )}
      </main>
    </div>
  );
}
