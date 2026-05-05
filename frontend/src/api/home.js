import client from './client'

export const getHome = ({ slot = 'LUNCH' } = {}) =>
  client.get('/home', { params: { slot } }).then((response) => response.data)
