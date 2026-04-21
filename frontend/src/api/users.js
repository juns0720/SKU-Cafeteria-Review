import client from './client'

export const getMe = () =>
  client.get('/auth/me').then((response) => response.data)

export const checkNicknameAvailability = (nickname) =>
  client
    .get('/auth/me/nickname/availability', { params: { nickname } })
    .then((response) => response.data)

export const updateNickname = (nickname) =>
  client.patch('/auth/me/nickname', { nickname }).then((response) => response.data)

export const updateAvatarColor = (avatarColor) =>
  client.patch('/auth/me/avatar-color', { avatarColor }).then((response) => response.data)
