import React from 'react';
import { Card, CardBody, CardTitle, CardSubtitle, CardText } from 'reactstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faLinkedin } from '@fortawesome/free-brands-svg-icons';

const CardComponent = ({ title, subtitle, text, backgroundColor, link }) => (
  <Card style={{ width: '18%' }}>
    <CardBody style={{ backgroundColor, color: "white" }}>
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <CardTitle style={{ fontWeight: "bold", fontSize: 23 }}>{title}</CardTitle>
      </div>
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <CardSubtitle style={{ fontWeight: "bold", fontSize: 15 }}>{subtitle}</CardSubtitle>
      </div>
      <CardText>{text}</CardText>
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <a href={link} target="_blank" rel="noopener noreferrer" style={{ display: 'block', textAlign: 'center', textDecoration: 'none' }}>
          <FontAwesomeIcon icon={faLinkedin} size="2x" style={{ color: 'white' }} />
        </a>
      </div>
    </CardBody>
  </Card>
);

export default CardComponent;
