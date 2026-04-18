import client from './client'

export const getReviews = (menuId, page = 0, size = 10) =>
  client.get('/reviews', { params: { menuId, page, size } })

export const getMyReviews = () => client.get('/reviews/me')

export const createReview = (data) => client.post('/reviews', data)

export const updateReview = (reviewId, data) => client.put(`/reviews/${reviewId}`, data)

export const deleteReview = (reviewId) => client.delete(`/reviews/${reviewId}`)
