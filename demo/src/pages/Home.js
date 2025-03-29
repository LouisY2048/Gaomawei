import React from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ArrowRight } from 'react-feather';
import Card from '../components/Card';
import Button from '../components/Button';

const PageContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 40px 20px;
  max-width: 1200px;
  margin: 0 auto;
`;

const Title = styled.h1`
  font-size: 48px;
  font-weight: 700;
  text-align: center;
  margin-bottom: 24px;
  background: ${({ theme }) => theme.gradients.primary};
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
`;

const Subtitle = styled.p`
  font-size: 20px;
  color: ${({ theme }) => theme.colors.text2};
  text-align: center;
  margin-bottom: 48px;
  max-width: 600px;
`;

const CardsContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 24px;
  width: 100%;
  margin-bottom: 48px;
`;

const FeatureCard = styled(Card)`
  padding: 24px;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    transform: translateY(-4px);
  }
`;

const FeatureTitle = styled.h3`
  font-size: 24px;
  font-weight: 600;
  margin-bottom: 16px;
  color: ${({ theme }) => theme.colors.text1};
`;

const FeatureDescription = styled.p`
  font-size: 16px;
  color: ${({ theme }) => theme.colors.text2};
  margin-bottom: 24px;
`;

const StatsContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 24px;
  width: 100%;
  margin-bottom: 48px;
`;

const StatCard = styled(Card)`
  padding: 24px;
  text-align: center;
`;

const StatValue = styled.div`
  font-size: 36px;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.primary1};
  margin-bottom: 8px;
`;

const StatLabel = styled.div`
  font-size: 16px;
  color: ${({ theme }) => theme.colors.text2};
`;

const Home = () => {
  const navigate = useNavigate();

  const features = [
    {
      title: 'Swap Tokens',
      description: 'Trade any combination of tokens with deep liquidity and minimal slippage.',
      path: '/swap'
    },
    {
      title: 'Provide Liquidity',
      description: 'Earn fees by providing liquidity to trading pools.',
      path: '/pools'
    },
    {
      title: 'View Analytics',
      description: 'Track your portfolio and analyze market trends.',
      path: '/analytics'
    }
  ];

  const stats = [
    {
      value: '$1.2M',
      label: 'Total Value Locked'
    },
    {
      value: '10K+',
      label: 'Total Transactions'
    },
    {
      value: '1K+',
      label: 'Active Users'
    }
  ];

  return (
    <PageContainer>
      <Title>Welcome to Gaomawei DEX</Title>
      <Subtitle>
        A decentralized exchange platform for seamless token swaps and liquidity provision
      </Subtitle>

      <CardsContainer>
        {features.map((feature, index) => (
          <FeatureCard
            key={index}
            onClick={() => navigate(feature.path)}
            animate
          >
            <FeatureTitle>{feature.title}</FeatureTitle>
            <FeatureDescription>{feature.description}</FeatureDescription>
            <Button
              variant="outline"
              fullWidth
              rightIcon={<ArrowRight size={20} />}
            >
              Get Started
            </Button>
          </FeatureCard>
        ))}
      </CardsContainer>

      <StatsContainer>
        {stats.map((stat, index) => (
          <StatCard key={index}>
            <StatValue>{stat.value}</StatValue>
            <StatLabel>{stat.label}</StatLabel>
          </StatCard>
        ))}
      </StatsContainer>
    </PageContainer>
  );
};

export default Home; 