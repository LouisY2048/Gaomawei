import React from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import PropTypes from 'prop-types';
import { theme } from '../../styles/theme.js';

const CardWrapper = styled(motion.div)`
  background: ${({ theme }) => theme.colors.bg2};
  border-radius: ${({ theme }) => theme.borderRadius.large};
  box-shadow: ${({ theme }) => theme.shadows.medium};
  padding: ${({ padding }) => padding || theme.spacing.lg};
  width: 100%;
  position: relative;
  overflow: hidden;
`;

const CardHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: ${({ theme }) => theme.spacing.md};
`;

const CardTitle = styled.h3`
  color: ${({ theme }) => theme.colors.text1};
  font-size: ${({ theme }) => theme.typography.h3.size};
  font-weight: ${({ theme }) => theme.typography.h3.weight};
  margin: 0;
`;

const CardDescription = styled.p`
  color: ${({ theme }) => theme.colors.text2};
  font-size: ${({ theme }) => theme.typography.body.size};
  margin: ${({ theme }) => theme.spacing.xs} 0 ${({ theme }) => theme.spacing.md};
`;

const CardContent = styled.div`
  position: relative;
`;

const CardFooter = styled.div`
  display: flex;
  align-items: center;
  justify-content: ${({ align }) => align || 'flex-start'};
  margin-top: ${({ theme }) => theme.spacing.md};
  gap: ${({ theme }) => theme.spacing.sm};
`;

const Card = React.forwardRef(({ 
  children, 
  title,
  description,
  headerRight,
  footer,
  footerAlign,
  padding,
  animate = true,
  ...props 
}, ref) => {
  const animations = animate ? {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.3 }
  } : {};

  return (
    <CardWrapper ref={ref} padding={padding} {...animations} {...props}>
      {(title || headerRight) && (
        <CardHeader>
          <div>
            {title && <CardTitle>{title}</CardTitle>}
            {description && <CardDescription>{description}</CardDescription>}
          </div>
          {headerRight}
        </CardHeader>
      )}
      
      <CardContent>{children}</CardContent>
      
      {footer && (
        <CardFooter align={footerAlign}>
          {footer}
        </CardFooter>
      )}
    </CardWrapper>
  );
});

Card.propTypes = {
  children: PropTypes.node.isRequired,
  title: PropTypes.string,
  description: PropTypes.string,
  headerRight: PropTypes.node,
  footer: PropTypes.node,
  footerAlign: PropTypes.string,
  padding: PropTypes.string,
  animate: PropTypes.bool,
};

Card.displayName = 'Card';

export default Card; 