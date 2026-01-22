import { useForm } from 'react-hook-form'
import { Monteur } from '../types'
import { Loader2, Save } from 'lucide-react'

interface MonteurFormData {
  nom: string
  prenom: string
  email: string
  telephone: string
  adresse: string
  dateEmbauche: string
  numeroIdentification: string
  actif: boolean
}

interface MonteurFormProps {
  monteur?: Monteur
  onSubmit: (data: MonteurFormData) => Promise<void>
  onCancel: () => void
  isLoading?: boolean
}

export const MonteurForm = ({ monteur, onSubmit, onCancel, isLoading }: MonteurFormProps) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<MonteurFormData>({
    defaultValues: monteur
      ? {
          nom: monteur.nom,
          prenom: monteur.prenom,
          email: monteur.email,
          telephone: monteur.telephone,
          adresse: monteur.adresse,
          dateEmbauche: monteur.dateEmbauche.split('T')[0],
          numeroIdentification: monteur.numeroIdentification,
          actif: monteur.actif,
        }
      : {
          actif: true,
          dateEmbauche: new Date().toISOString().split('T')[0],
        },
  })

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Prenom *
          </label>
          <input
            type="text"
            {...register('prenom', { required: 'Prenom requis' })}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              errors.prenom ? 'border-red-500' : 'border-gray-300'
            }`}
          />
          {errors.prenom && (
            <p className="mt-1 text-sm text-red-600">{errors.prenom.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Nom *
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
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Email *
        </label>
        <input
          type="email"
          {...register('email', {
            required: 'Email requis',
            pattern: {
              value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
              message: 'Email invalide',
            },
          })}
          className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
            errors.email ? 'border-red-500' : 'border-gray-300'
          }`}
        />
        {errors.email && (
          <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Telephone *
          </label>
          <input
            type="tel"
            {...register('telephone', { required: 'Telephone requis' })}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              errors.telephone ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="06 12 34 56 78"
          />
          {errors.telephone && (
            <p className="mt-1 text-sm text-red-600">{errors.telephone.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            N° Identification *
          </label>
          <input
            type="text"
            {...register('numeroIdentification', { required: 'Numero requis' })}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              errors.numeroIdentification ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="MTR-001"
          />
          {errors.numeroIdentification && (
            <p className="mt-1 text-sm text-red-600">{errors.numeroIdentification.message}</p>
          )}
        </div>
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

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Date d'embauche *
          </label>
          <input
            type="date"
            {...register('dateEmbauche', { required: 'Date requise' })}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              errors.dateEmbauche ? 'border-red-500' : 'border-gray-300'
            }`}
          />
          {errors.dateEmbauche && (
            <p className="mt-1 text-sm text-red-600">{errors.dateEmbauche.message}</p>
          )}
        </div>

        <div className="flex items-center pt-7">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              {...register('actif')}
              className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">Monteur actif</span>
          </label>
        </div>
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
              {monteur ? 'Modifier' : 'Creer'}
            </>
          )}
        </button>
      </div>
    </form>
  )
}
