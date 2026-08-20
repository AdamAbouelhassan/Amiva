import { db as defaultDb } from '../adminApp';
import { ConfigStore, ScoringConfigDoc } from '../lib/remoteConfig';

/** technical_specification.md §4.2: tunable constants "stored in a config
 * collection so they can be adjusted without redeploying." Single doc at
 * `config/scoring`; any subset of fields may be present. */
export class FirestoreConfigStore implements ConfigStore {
  constructor(private readonly db: FirebaseFirestore.Firestore = defaultDb) {}

  async getScoringConfig(): Promise<Partial<ScoringConfigDoc> | undefined> {
    const snap = await this.db.collection('config').doc('scoring').get();
    return snap.exists ? (snap.data() as Partial<ScoringConfigDoc>) : undefined;
  }
}
