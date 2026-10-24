import React from 'react'
import ServicePage from './ServicePage'

// Services component delegates directly to the elevated ServicePage
const Services = (props) => {
    return <ServicePage {...props} />
}

export default Services