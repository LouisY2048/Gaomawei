import React from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';

const CardWrapper = styled(motion.div)`
  background: ${({ theme }) => theme.colors.bg0};
  border-radius: ${({ theme }) => theme.borderRadius.large};
  box-shadow: ${({ theme }) => theme.shadows.medium};
  padding: ${({ padding }) => padding || '24px'};
  width: 100%;
  position: relative;
  overflow: hidden;
`;

const CardHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
`;

const CardTitle = styled.h3`
  color: ${({ theme }) => theme.colors.text1};
  font-size: 18px;
  font-weight: 600;
  margin: 0;
`;

const CardContent = styled.div`
  position: relative;
`;

const Card = ({ 
  children, 
  title, 
  headerRight,
  padding,
  animate = true,
  ...props 
}) => {
  const animations = animate ? {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.3 }
  } : {};

  return (
    <CardWrapper padding={padding} {...animations} {...props}>
      {(title || headerRight) && (
        <CardHeader>
          {title && <CardTitle>{title}</CardTitle>}
          {headerRight}
        </CardHeader>
      )}
      <CardContent>{children}</CardContent>
    </CardWrapper>
  );
};

export default Card; 