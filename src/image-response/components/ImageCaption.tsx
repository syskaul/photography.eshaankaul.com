import { ReactNode } from 'react';

const GRADIENT_STOPS = 'rgba(0,0,0,0), rgba(0,0,0,0.3), rgba(0,0,0,0.7)';

export default function ImageCaption({
  height,
  fontFamily,
  icon,
  title,
  gap = '1rem', // Mimic mono font space metric
  children,
}: {
  width: number
  height: number
  fontFamily: string
  icon?: ReactNode
  title?: string
  gap?: string
  children?: ReactNode
}) {
  const paddingEdge = height * .07;
  const paddingContent = height * .6;
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      position: 'absolute',
      paddingLeft: height * .0875,
      paddingRight: height * .0875,
      color: 'white',
      backgroundBlendMode: 'multiply',
      fontFamily,
      fontWeight: 400,
      fontSize: height *.08,
      gap, 
      lineHeight: 1.2,
      left: 0,
      right: 0,
      paddingTop: paddingContent,
      paddingBottom: paddingEdge,
      background: `linear-gradient(to bottom, ${GRADIENT_STOPS})`,
      bottom: 0,
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: height * .034,
        marginBottom: -height * .008,
      }}>
        {icon}
        <div
          style={{
            display: 'flex',
            gap: height * .048,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {title}
        </div>
      </div>
      {children}
    </div>
  );
}
