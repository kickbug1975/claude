import { useForm } from 'react-hook-form'
import { Chantier } from '../types'
import { Loader2, Save } from 'lucide-react'

interface ChantierFormData {
  nom: string
  adresse: string
  client: string
  reference: string
  dateDebut: string
  dateFin?: string
  description: string
  actif: boolean
}

interface ChantierFormProps {
  chantier?: Chantier
  onSubmit: (data: ChantierFormData) => Promise<void>
  onCancel: () => void
  isLoading?: boolean
}

export const ChantierForm = ({ chantier, onSubmit, onCancel, isLoading }: ChantierFormProps) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ChantierFormData>({
    defaultValues: chantier
      ? {
          nom: chantier.nom,
          adresse: chantier.adresse,
          client: chantier.client,
          reference: chantier.reference,
          dateDebut: chantier.dateDebut.split('T')[0],
          dateFin: chantier.dateFin ? chantier.dateFin.split('T')[0] : '',
          description: chantier.description,
          actif: chantier.actif,
        }
      : {
          actif: true,
          dateDebut: new Date().toISOString().split('T')[0],
        },
  })

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Nom du chantier *
          </label>
          <input
            type="text"
            {...register('nom', { required: 'Nom requis' })}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              errors.nom ? 'border-red-500' : 'border-gray-300'
            }`}
          />
          {errors.nom && (
            <p className="mt-1 text-sm text-red-600">{errors.nom.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Reference *
          </label>
          <input
            type="text"
            {...register('reference', { required: 'Reference requise' })}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              errors.reference ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="CHT-001"
          />
          {errors.reference && (
            <p className="mt-1 text-sm text-red-600">{errors.reference.message}</p>
          )}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Client *
        </label>
        <input
          type="text"
          {...register('client', { required: 'Client requis' })}
          className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
            errors.client ? 'border-red-500' : 'border-gray-300'
          }`}
        />
        {errors.client && (
          <p className="mt-1 text-sm text-red-600">{errors.client.message}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Adresse *
        </label>
        <input
          type="text"
          {...register('adresse', { required: 'Adresse requise' })}
          className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
            errors.adresse ? 'border-red-500' : 'border-gray-300'
          }`}
        />
        {errors.adresse && (
          <p className="mt-1 text-sm text-red-600">{errors.adresse.message}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Description *
        </label>
        <textarea
          {...register('description', { required: 'Description requise' })}
          rows={3}
          className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
            errors.description ? 'border-red-500' : 'border-gray-300'
          }`}
        />
        {errors.description && (
          <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Date de debut *
          </label>
          <input
            type="date"
            {...register('dateDebut', { required: 'Date requise' })}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              errors.dateDebut ? 'border-red-500' : 'border-gray-300'
            }`}
          />
          {errors.dateDebut && (
            <p className="mt-1 text-sm text-red-600">{errors.dateDebut.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Date de fin
          </label>
          <input
            type="date"
            {...register('dateFin')}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      <div className="flex items-center">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            {...register('actif')}
            className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
          />
          <span className="text-sm text-gray-700">Chantier actif</span>
        </label>
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
              {chantier ? 'Modifier' : 'Creer'}
            </>
          )}
        </button>
      </div>
    </form>
  )
}
