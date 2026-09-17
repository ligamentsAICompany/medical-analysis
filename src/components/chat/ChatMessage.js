'use client'

import React from 'react'
import { PiRobot, PiUser } from 'react-icons/pi'
import { ChatFeedback } from './ChatFeedback'
import { AnalysisReportBody } from '../analysis/ImageAnalysisView'

// Same rich report rendering the Analysis page uses (header, AI insights,
// indication, technique, findings, impression) — so a chat response looks
// identical to an Analysis-page report instead of the previous stripped-
// down classification/summary/findings/impression-only view.
function AnalysisResponseView ({ analysisResponse }) {
  if (!analysisResponse) return null
  const { classification, summary, imageAnalysis } = analysisResponse

  if (!imageAnalysis) {
    // Text-only responses (no imageAnalysis) have nothing for
    // AnalysisReportBody to render — fall back to the plain summary view.
    return (
      <div className="assistant-msg__text">
        {classification?.type ? (
          <p>
            <strong className="assistant-msg__strong">{classification.type}</strong>
            {typeof classification.confidence === 'number'
              ? ` (confidence ${(classification.confidence * 100).toFixed(0)}%)`
              : ''}
          </p>
        ) : null}
        {summary ? <p>{summary}</p> : null}
      </div>
    )
  }

  return (
    <div className="assistant-msg__text assistant-msg__report">
      <AnalysisReportBody analysisResponse={analysisResponse} />
    </div>
  )
}

/**
 * One chat turn: the user's upload + the analysis response bubble, with a
 * feedback control tied to the message ID.
 * @param {{ turn: { id: string, kind: 'user'|'assistant'|'error', fileName?: string, chatMessage?: object, text?: string }, onFeedbackSubmitted?: (messageId: string, feedback: object) => void }} props
 */
export function ChatMessage ({ turn, onFeedbackSubmitted }) {
  if (turn.kind === 'user') {
    return (
      <div className="assistant-msg assistant-msg--user">
        <div className="assistant-msg__avatar" aria-hidden><PiUser size={14} /></div>
        <div className="assistant-msg__bubble assistant-msg__bubble--user">
          <div className="assistant-msg__text">Uploaded: {turn.fileName}</div>
        </div>
      </div>
    )
  }

  const isThinking = turn.kind === 'thinking'
  const isError = turn.kind === 'error'
  const chatMessage = turn.chatMessage

  return (
    <div className="assistant-msg assistant-msg--assistant">
      <div className="assistant-msg__avatar" aria-hidden><PiRobot size={14} /></div>
      <div className="assistant-msg__bubble">
        {isThinking ? (
          <span className="assistant-msg__thinking">
            <span className="assistant-msg__dot" />
            <span className="assistant-msg__dot" />
            <span className="assistant-msg__dot" />
          </span>
        ) : isError ? (
          <div className="assistant-msg__text">{turn.text}</div>
        ) : (
          <>
            <AnalysisResponseView analysisResponse={chatMessage?.analysisResponse} />
            {chatMessage?.messageId ? (
              <ChatFeedback
                messageId={chatMessage.messageId}
                existingFeedback={chatMessage.feedback}
                onSubmitted={(feedback) => onFeedbackSubmitted?.(chatMessage.messageId, feedback)}
              />
            ) : null}
          </>
        )}
      </div>
    </div>
  )
}
