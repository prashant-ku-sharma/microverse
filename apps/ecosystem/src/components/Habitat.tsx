import { Box } from '@mui/material';

/** Static illustration of the intended architecture. No connections are live. */
export function Habitat() {
  return (
    <Box sx={{ width: '100%', maxWidth: 440, mx: 'auto' }}>
      <svg
        role="img"
        aria-labelledby="habitat-title habitat-desc"
        viewBox="0 0 440 300"
        width="100%"
      >
        <title id="habitat-title">One host, four independent organisms</title>
        <desc id="habitat-desc">
          Conceptual ecosystem map. The connections are illustrative, not live
          runtime links.
        </desc>
        <defs>
          <radialGradient id="habitat-glow">
            <stop stopColor="#73e5b0" stopOpacity=".16" />
            <stop offset="1" stopColor="#73e5b0" stopOpacity="0" />
          </radialGradient>
        </defs>
        <circle cx="220" cy="145" r="142" fill="url(#habitat-glow)" />
        <g stroke="#73e5b0" fill="none">
          <ellipse
            cx="220"
            cy="145"
            rx="160"
            ry="103"
            strokeOpacity=".12"
            transform="rotate(-15 220 145)"
          />
          <ellipse
            cx="220"
            cy="145"
            rx="113"
            ry="132"
            strokeOpacity=".1"
            transform="rotate(30 220 145)"
          />
          <circle
            cx="220"
            cy="145"
            r="83"
            strokeOpacity=".1"
            strokeDasharray="3 7"
          />
        </g>
        <g stroke="#6f9f85" strokeOpacity=".5" strokeDasharray="3 6">
          <path d="M220 145 105 65M220 145 347 95M220 145 315 239M220 145 95 218" />
        </g>
        <circle
          cx="220"
          cy="145"
          r="48"
          fill="#163428"
          stroke="#73e5b0"
          strokeOpacity=".65"
        />
        <circle
          cx="220"
          cy="145"
          r="39"
          fill="none"
          stroke="#73e5b0"
          strokeOpacity=".2"
        />
        <g fill="#73e5b0">
          <circle cx="220" cy="135" r="5" />
          <circle cx="210" cy="150" r="3" />
          <circle cx="230" cy="150" r="3" />
        </g>
        <text
          x="220"
          y="214"
          textAnchor="middle"
          fill="#a5b8ac"
          fontSize="9"
          letterSpacing="2"
        >
          ECOSYSTEM / HOST
        </text>
        <g fill="#0e1c16" strokeWidth="1.5">
          <circle cx="105" cy="65" r="24" stroke="#89baff" />
          <circle cx="347" cy="95" r="24" stroke="#b9a2ff" />
          <circle cx="315" cy="239" r="24" stroke="#f1c579" />
          <circle cx="95" cy="218" r="24" stroke="#ffab9c" />
        </g>
        <g fill="none" strokeWidth="1.5">
          <path d="M96 65h18m-9-9v18" stroke="#89baff" />
          <path d="m338 91 3 12h12l3-12m-14 0h10" stroke="#b9a2ff" />
          <circle cx="315" cy="235" r="4" stroke="#f1c579" />
          <path d="M307 247q8-10 16 0" stroke="#f1c579" />
          <path d="m95 208 9 10-9 10-9-10Z" stroke="#ffab9c" />
        </g>
        <g fontSize="9" letterSpacing="1.5" textAnchor="middle">
          <text x="105" y="30" fill="#89baff">
            PARASITE
          </text>
          <text x="347" y="60" fill="#b9a2ff">
            SYMBIONT
          </text>
          <text x="315" y="280" fill="#f1c579">
            COMMENSAL
          </text>
          <text x="95" y="259" fill="#ffab9c">
            MUTANT
          </text>
        </g>
      </svg>
    </Box>
  );
}
