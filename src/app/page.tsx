"use client";

import { useState } from "react";
import StepSidebar from "@/components/StepSidebar";
import SchemaInput from "@/components/SchemaInput";
import SchemaReview from "@/components/SchemaReview";
import ContextExport from "@/components/ContextExport";
import { Schema } from "@/lib/types";

export default function Home() {
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);
  const [userInput, setUserInput] = useState("");
  const [parsedSchema, setParsedSchema] = useState<Schema | null>(null);
  const [generatedMarkdown, setGeneratedMarkdown] = useState("");
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
    setError("");
    setCurrentStep(1);
  };

  return (
    <div className="flex flex-col md:flex-row min-h-screen">
      <StepSidebar currentStep={currentStep} />
      <main className="flex-1 px-5 py-6 md:px-12 md:py-10 max-w-3xl">
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
            onStartOver={handleStartOver}
          />
        )}
      </main>
    </div>
  );
}
