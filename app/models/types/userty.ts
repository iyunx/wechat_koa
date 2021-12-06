type TContact = {
  uid: number
  fid: number
  room_id: string
  rname?: string
  rphone?: string
  initial: string
  star: boolean
  remark?: string
}

type TRemind = {
  id: number,
  user_id: number,
  from_id: number,
  state: boolean,
  content: object,
  over_at: Date
}

type TRemark = {
  from: string;
  who: 'ME' | 'TA',
  img: string,
  text: string
}

export {
  TContact,
  TRemind,
  TRemark
}