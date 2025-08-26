import Dexie from 'dexie'
import { databaseId } from '@/store/main'
import type { Slide } from '@/types/slides'
import { LOCALSTORAGE_KEY_DISCARDED_DB } from '@/configs/storage'

export interface writingBoardImg {
  id: string
  dataURL: string
}

export interface Snapshot {
  index: number
  slides: Slide[]
}

const databaseNamePrefix = 'PPTist'

// Delete expired/invalid databases
// When the application closes (closing or refreshing the browser), the database ID will be recorded in localStorage, indicating that the database pointed to by this ID is invalid
// When the application initializes, it checks all current databases and deletes those marked as invalid  
// Additionally, databases older than 12 hours from initialization time will also be deleted (this is to prevent databases that were not properly deleted due to unexpected circumstances)
export const deleteDiscardedDB = async () => {
  const now = new Date().getTime()

  const localStorageDiscardedDB = localStorage.getItem(LOCALSTORAGE_KEY_DISCARDED_DB)
  const localStorageDiscardedDBList: string[] = localStorageDiscardedDB ? JSON.parse(localStorageDiscardedDB) : []

  const databaseNames = await Dexie.getDatabaseNames()
  const discardedDBNames = databaseNames.filter(name => {
    if (name.indexOf(databaseNamePrefix) === -1) return false
    
    const [prefix, id, time] = name.split('_')
    if (prefix !== databaseNamePrefix || !id || !time) return true
    if (localStorageDiscardedDBList.includes(id)) return true
    if (now - (+time) >= 1000 * 60 * 60 * 12) return true

    return false
  })

  for (const name of discardedDBNames) Dexie.delete(name)
  localStorage.removeItem(LOCALSTORAGE_KEY_DISCARDED_DB)
}

class PPTistDB extends Dexie {
  public snapshots: Dexie.Table<Snapshot, number>
  public writingBoardImgs: Dexie.Table<writingBoardImg, number>

  public constructor() {
    super(`${databaseNamePrefix}_${databaseId}_${new Date().getTime()}`)
    this.version(1).stores({
      snapshots: '++id',
      writingBoardImgs: '++id',
    })
    this.snapshots = this.table('snapshots')
    this.writingBoardImgs = this.table('writingBoardImgs')
  }
}

export const db = new PPTistDB()
