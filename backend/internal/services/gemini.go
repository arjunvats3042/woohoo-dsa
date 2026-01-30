package services

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strings"

	"woohoodsa/internal/config"
	"woohoodsa/internal/models"
)

// OpenRouter API request structure (OpenAI compatible)
type OpenRouterRequest struct {
	Model    string          `json:"model"`
	Messages []OpenAIMessage `json:"messages"`
}

type OpenAIMessage struct {
	Role    string `json:"role"`
	Content string `json:"content"`
}

// OpenRouter API response structure
type OpenRouterResponse struct {
	Choices []struct {
		Message struct {
			Content string `json:"content"`
		} `json:"message"`
	} `json:"choices"`
	Error *struct {
		Message string `json:"message"`
	} `json:"error,omitempty"`
}

type EvaluationResult struct {
	Verdict  string `json:"verdict"`
	Feedback string `json:"feedback"`
	Passed   bool   `json:"passed"`
}

func EvaluateCode(problem models.Problem, userCode string, apiKey string) (*EvaluationResult, error) {
	prompt := buildEvaluationPrompt(problem, userCode)
	return callOpenRouterAPI(prompt, apiKey)
}

func callOpenRouterAPI(prompt string, apiKey string) (*EvaluationResult, error) {
	requestBody := OpenRouterRequest{
		Model: "arcee-ai/trinity-large-preview:free", // Using free model via OpenRouter
		Messages: []OpenAIMessage{
			{
				Role:    "user",
				Content: prompt,
			},
		},
	}

	jsonBody, err := json.Marshal(requestBody)
	if err != nil {
		return nil, err
	}

	req, err := http.NewRequest("POST", "https://openrouter.ai/api/v1/chat/completions", bytes.NewBuffer(jsonBody))
	if err != nil {
		return nil, err
	}

	// Use user API key if provided, otherwise fallback to config
	token := apiKey
	if token == "" {
		token = config.AppConfig.OpenRouterAPIKey
	}

	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+token)
	req.Header.Set("HTTP-Referer", "http://localhost:3000") // Required by OpenRouter
	req.Header.Set("X-Title", "Woohoo DSA")                 // Optional, for rankings

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, err
	}

	// Check for non-200 status codes
	if resp.StatusCode != http.StatusOK {
		fmt.Printf("OpenRouter API error - Status: %d, Body: %s\n", resp.StatusCode, string(body))
		return nil, fmt.Errorf("openrouter api returned status: %d, body: %s", resp.StatusCode, string(body))
	}

	var openRouterResp OpenRouterResponse
	if err := json.Unmarshal(body, &openRouterResp); err != nil {
		return nil, err
	}

	// Check for API error in response
	if openRouterResp.Error != nil {
		return nil, fmt.Errorf("openrouter api error: %s", openRouterResp.Error.Message)
	}

	if len(openRouterResp.Choices) == 0 {
		return &EvaluationResult{
			Verdict:  "Error",
			Feedback: "Failed to get response from AI",
			Passed:   false,
		}, nil
	}

	responseText := openRouterResp.Choices[0].Message.Content
	return parseEvaluationResponse(responseText), nil
}

func buildEvaluationPrompt(problem models.Problem, userCode string) string {
	testCasesStr := ""
	for i, tc := range problem.TestCases {
		testCasesStr += fmt.Sprintf("\nTest Case %d:\nInput: %s\nExpected Output: %s\n", i+1, tc.Input, tc.Expected)
	}

	return fmt.Sprintf(`You are a code judge for a DSA practice platform. Evaluate the following C++ solution.

PROBLEM: %s

DESCRIPTION:
%s

TEST CASES:%s

USER'S CODE:
%s

INSTRUCTIONS:
1. Analyze the logic and correctness of the code
2. Check if it would produce correct output for all test cases
3. Check for potential runtime errors, out of bounds, etc.

Respond in this EXACT format (use these exact words):
VERDICT: [Accepted/Wrong Answer/Runtime Error/Compilation Error]
FEEDBACK: [Brief explanation of why the code passed or failed, max 2-3 sentences]

Be fair but strict. If the logic is correct and handles all cases, mark it as Accepted.`,
		problem.Title,
		problem.Description,
		testCasesStr,
		userCode,
	)
}

func parseEvaluationResponse(response string) *EvaluationResult {
	result := &EvaluationResult{
		Verdict:  "Error",
		Feedback: "Unable to parse response",
		Passed:   false,
	}

	lines := strings.Split(response, "\n")
	for _, line := range lines {
		line = strings.TrimSpace(line)
		if strings.HasPrefix(line, "VERDICT:") {
			verdict := strings.TrimSpace(strings.TrimPrefix(line, "VERDICT:"))
			result.Verdict = verdict
			result.Passed = strings.Contains(strings.ToLower(verdict), "accepted")
		} else if strings.HasPrefix(line, "FEEDBACK:") {
			result.Feedback = strings.TrimSpace(strings.TrimPrefix(line, "FEEDBACK:"))
		}
	}

	return result
}
