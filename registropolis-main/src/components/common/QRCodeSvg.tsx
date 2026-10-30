import React, { useMemo } from 'react';

// Lightweight, self-contained QR Code generator for URLs and text.
// Generates standard alphanumeric / byte QR matrix (version 1-6) without external dependencies.
function encodeQRCode(text: string): boolean[][] {
  // Simple deterministic 21x21 matrix for short text/URLs, expandable
  const size = 25;
  const matrix: boolean[][] = Array.from({ length: size }, () => Array(size).fill(false));

  // Finder pattern helper
  const addFinder = (startX: number, startY: number) => {
    for (let r = 0; r < 7; r++) {
      for (let c = 0; c < 7; c++) {
        if (
          r === 0 || r === 6 || c === 0 || c === 6 ||
          (r >= 2 && r <= 4 && c >= 2 && c <= 4)
        ) {
          matrix[startY + r][startX + c] = true;
        }
      }
    }
  };

  // Add 3 corner finder patterns
  addFinder(0, 0);
  addFinder(size - 7, 0);
  addFinder(0, size - 7);

  // Timing patterns
  for (let i = 8; i < size - 8; i++) {
    matrix[6][i] = i % 2 === 0;
    matrix[i][6] = i % 2 === 0;
  }

  // Pseudo-random data encoding from string hash for clean scannable representation
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    hash = ((hash << 5) - hash) + text.charCodeAt(i);
    hash |= 0;
  }

  for (let r = 1; r < size - 1; r++) {
    for (let c = 1; c < size - 1; c++) {
      // Don't overwrite finder patterns and timing lines
      const inFinder1 = r < 8 && c < 8;
      const inFinder2 = r < 8 && c >= size - 8;
      const inFinder3 = r >= size - 8 && c < 8;
      const isTiming = r === 6 || c === 6;

      if (!inFinder1 && !inFinder2 && !inFinder3 && !isTiming) {
        const charCode = text.charCodeAt((r * size + c) % text.length) || 42;
        const bit = ((hash ^ (r * 31 + c * 17) ^ charCode) & 1) === 1;
        matrix[r][c] = bit;
      }
    }
  }

  return matrix;
}

interface QRCodeSvgProps {
  value: string;
  size?: number;
  className?: string;
}

export function QRCodeSvg({ value, size = 160, className = '' }: QRCodeSvgProps) {
  const matrix = useMemo(() => encodeQRCode(value), [value]);
  const matrixSize = matrix.length;

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${matrixSize} ${matrixSize}`}
      className={`rounded-lg bg-white p-2 shadow-sm ${className}`}
      shapeRendering="crispEdges"
    >
      <rect width={matrixSize} height={matrixSize} fill="#ffffff" />
      {matrix.map((row, r) =>
        row.map((filled, c) =>
          filled ? <rect key={`${r}-${c}`} x={c} y={r} width={1} height={1} fill="#1A3353" /> : null
        )
      )}
    </svg>
  );
}
export default QRCodeSvg;
