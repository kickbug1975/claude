import { useEffect, useState } from 'react'
import { useForm, useFieldArray } from 'react-hook-form'
import { FeuilleTravail, Monteur, Chantier } from '../types'
import { monteurService } from '../services/monteurService'
import { chantierService } from '../services/chantierService'
import { Loader2, Save, Plus, Trash2 } from 'lucide-react'

interface FraisFormData {
  typeFrais: 'TRANSPORT' | 'MATERIEL' | 'REPAS' | 'AUTRES'
  montant: number
  description: string
}

interface FeuilleFormData {
  monteurId: string
  chantierId: string
  dateTravail: string
  heureDebut: string
  heureFin: string
  descriptionTravail: string
  frais: FraisFormData[]
}

interface FeuilleFormProps {
  feuille?: FeuilleTravail
  onSubmit: (data: FeuilleFormData) => Promise<void>
  onCancel: () => void
  isLoading?: boolean
}

const typeFraisOptions = [
  { value: 'TRANSPORT', label: 'Transport' },
  { value: 'MATERIEL', label: 'Materiel' },
  { value: 'REPAS', label: 'Repas' },
  { value: 'AUTRES', label: 'Autres' },
]

export const FeuilleForm = ({ feuille, onSubmit, onCancel, isLoading }: FeuilleFormProps) => {
  const [monteurs, setMonteurs] = useState<Monteur[]>([])
  const [chantiers, setChantiers] = useState<Chantier[]>([])
  const [loadingData, setLoadingData] = useState(true)

  const {
    register,
    handleSubmit,
    control,
    watch,
    formState: { errors },
  } = useForm<FeuilleFormData>({
    defaultValues: feuille
      ? {
          monteurId: feuille.monteurId,
          chantierId: feuille.chantierId,
          dateTravail: feuille.dateTravail.split('T')[0],
          heureDebut: feuille.heureDebut,
          heureFin: feuille.heureFin,
          descriptionTravail: feuille.descriptionTravail,
          frais: feuille.frais?.map((f) => ({
            typeFrais: f.typeFrais,
            montant: f.montant,
            description: f.description,
          })) || [],
        }
      : {
          dateTravail: new Date().toISOString().split('T')[0],
          heureDebut: '08:00',
          heureFin: '17:00',
          frais: [],
        },
  })

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'frais',
  })

  const watchFrais = watch('frais')
  const totalFrais = watchFrais?.reduce((acc, f) => acc + (Number(f.montant) || 0), 0) || 0

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [monteursResult, chantiersResult] = await Promise.all([
          monteurService.getAll(true),
          chantierService.getAll(true),
        ])

        // Gérer la réponse paginée ou non
        const monteursData = 'pagination' in monteursResult ? monteursResult.data : monteursResult
        const chantiersData = 'pagination' in chantiersResult ? chantiersResult.data : chantiersResult

        setMonteurs(monteursData)
        setChantiers(chantiersData)
      } catch (error) {
        console.error('Erreur chargement donnees:', error)
      } finally {
        setLoadingData(false)
      }
    }
    fetchData()
  }, [])

  if (loadingData) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="animate-spin text-blue-600" size={32} />
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Monteur *
          </label>
          <select
            {...register('monteurId', { required: 'Monteur requis' })}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              errors.monteurId ? 'border-red-500' : 'border-gray-300'
            }`}
            disabled={!!feuille}
          >
            <option value="">Selectionner un monteur</option>
            {monteurs.map((m) => (
              <option key={m.id} value={m.id}>
                {m.prenom} {m.nom} ({m.numeroIdentification})
              </option>
            ))}
          </select>
          {errors.monteurId && (
            <p className="mt-1 text-sm text-red-600">{errors.monteurId.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Chantier *
          </label>
          <select
            {...register('chantierId', { required: 'Chantier requis' })}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              errors.chantierId ? 'border-red-500' : 'border-gray-300'
            }`}
          >
            <option value="">Selectionner un chantier</option>
            {chantiers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nom} ({c.reference})
              </option>
            ))}
          </select>
          {errors.chantierId && (
            <p className="mt-1 text-sm text-red-600">{errors.chantierId.message}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Date de travail *
          </label>
          <input
            type="date"
            {...register('dateTravail', { required: 'Date requise' })}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              errors.dateTravail ? 'border-red-500' : 'border-gray-300'
            }`}
          />
          {errors.dateTravail && (
            <p className="mt-1 text-sm text-red-600">{errors.dateTravail.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Heure debut *
          </label>
          <input
            type="time"
            {...register('heureDebut', { required: 'Heure requise' })}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              errors.heureDebut ? 'border-red-500' : 'border-gray-300'
            }`}
          />
          {errors.heureDebut && (
            <p className="mt-1 text-sm text-red-600">{errors.heureDebut.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Heure fin *
          </label>
          <input
            type="time"
            {...register('heureFin', { required: 'Heure requise' })}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              errors.heureFin ? 'border-red-500' : 'border-gray-300'
            }`}
          />
          {errors.heureFin && (
            <p className="mt-1 text-sm text-red-600">{errors.heureFin.message}</p>
          )}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Description du travail *
        </label>
        <textarea
          {...register('descriptionTravail', { required: 'Description requise' })}
          rows={3}
          className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
            errors.descriptionTravail ? 'border-red-500' : 'border-gray-300'
          }`}
          placeholder="Decrivez les travaux effectues..."
        />
        {errors.descriptionTravail && (
          <p className="mt-1 text-sm text-red-600">{errors.descriptionTravail.message}</p>
        )}
      </div>

      <div className="border-t pt-4">
        <div className="flex items-center justify-between mb-4">
          <h4 className="font-medium text-gray-900">Frais</h4>
          <button
            type="button"
            onClick={() => append({ typeFrais: 'TRANSPORT', montant: 0, description: '' })}
            className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800"
          >
            <Plus size={16} />
            Ajouter un frais
          </button>
        </div>

        {fields.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-4">Aucun frais ajoute</p>
        ) : (
          <div className="space-y-3">
            {fields.map((field, index) => (
              <div key={field.id} className="flex gap-3 items-start p-3 bg-gray-50 rounded-lg">
                <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <select
                      {...register(`frais.${index}.typeFrais` as const)}
                      className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      {typeFraisOptions.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      {...register(`frais.${index}.montant` as const, { valueAsNumber: true })}
                      className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="Montant"
                    />
                  </div>
                  <div>
                    <input
                      type="text"
                      {...register(`frais.${index}.description` as const)}
                      className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="Description"
                    />
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => remove(index)}
                  className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}

            <div className="flex justify-end pt-2 text-sm">
              <span className="font-medium">Total: {totalFrais.toFixed(2)} EUR</span>
            </div>
          </div>
        )}
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 border rounded-lg hover:bg-gray-50"
          disabled={isLoading}
        >
          Annuler
        </button>
        <button
          type="submit"
          disabled={isLoading}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {isLoading ? (
            <>
              <Loader2 className="animate-spin" size={18} />
              Enregistrement...
            </>
          ) : (
            <>
              <Save size={18} />
              {feuille ? 'Modifier' : 'Creer'}
            </>
          )}
        </button>
      </div>
    </form>
  )
}
