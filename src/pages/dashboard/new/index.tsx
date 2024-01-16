import { Container } from "../../../components/container";
import { DashboardHeader } from "../../../components/panel";
import { Input } from "../../../components/input";
import { AuthContext } from "../../../contexts/AuthContext";

import { ChangeEvent, useState, useContext } from "react";
import { FiUpload, FiTrash } from "react-icons/fi";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { v4 as uuidV4 } from 'uuid'
import { storage, db } from "../../../services/firebaseConnection";
import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import { addDoc, collection } from "firebase/firestore";
import toast from "react-hot-toast";

const schema = z.object({
    name: z.string().min(1, 'O campo nome é obrigatório'),
    model: z.string().min(1, 'O modelo é obrigatório'),
    year: z.string().min(1, 'O ano do carro é obrigatório'),
    km: z.string().min(1, 'O KM do carro é obrigatório'),
    price: z.string().min(1, 'O preço é obrigatório'),
    city: z.string().min(1, 'O campo cidade é obrigatório'),
    whatsapp: z.string().min(1, "O Telefone é obrigatório").refine((value) => /^(\d{11,12})$/.test(value), {
        message: "Número de telefone inválido."
    }),
    description: z.string().min(1, 'O descrição é obrigatória')
})
type FormData = z.infer<typeof schema>;

interface ImageItemProps{
    uid: string,
    name: string,
    previewUrl: string,
    url: string;
}


export function New() {
    const { user } = useContext(AuthContext)
    const { register, handleSubmit, formState: { errors }, reset } = useForm<FormData>({
        resolver: zodResolver(schema),
        mode: 'onChange'
    })
    const [carImages, setCarImages] = useState<ImageItemProps[]>([]);
    
    async function handleFile(e: ChangeEvent<HTMLInputElement>) {
        if (e.target.files && e.target.files[0]) {
            const image = e.target.files[0]
            if (image.type === 'image/jpeg' || image.type === 'image/png') {
                await handleUpload(image)
            } else {
                alert('Envie apenas imagens no formato JPG ou PNG!');
            }
        }
    }
    async function handleUpload(image: File){
        if(!user?.uid){
            return;
        }
        const currentUid = user?.uid;
        const uidImage = uuidV4();
        const uploadoRef = ref(storage, `images/${currentUid}/${uidImage}`)
        uploadBytes(uploadoRef, image)
        .then((snapshot) => {
            getDownloadURL(snapshot.ref).then((downLoadoUrl) => {
                const imageItem = {
                    name: uidImage,
                    uid: currentUid,
                    previewUrl: URL.createObjectURL(image),
                    url: downLoadoUrl,
                }
                setCarImages((images) => [...images, imageItem])
                toast.success('Imagem cadastrada com sucesso!')
            })
        })
    }

    function onSubmit(data: FormData) {
        if(carImages.length === 0){
            toast.error('Envie pelo menos 1 imagem');
            return;
        }
        const carListImages = carImages.map(car => {
            return{
                uid: car.uid,
                name: car.name,
                url: car.url
            }
        })

        addDoc(collection(db, 'cars'), {
            name:data.name.toUpperCase(),
            model: data.model,
            whatsapp: data.whatsapp,
            city: data.city,
            year: data.year,
            km: data.km,
            price: data.price,
            description: data.description,
            created: new Date(),
            owner: user?.name,
            uid: user?.uid,
            images: carListImages
        })

        .then(() => {
            reset();
            setCarImages([]);
            toast.success('Carro cadastrado com sucesso!')
        })

        .catch(() => {
            toast.error('Erro ao fazer cadastro')
        })
    }

    async function handleDeleteImage(item: ImageItemProps){
        const imagePath = `images/${item.uid}/${item.name}`;
        const imageRef = ref(storage, imagePath);
        try{
            await deleteObject(imageRef)
            setCarImages(carImages.filter((car) => car.url !== item.url))
        }catch(error){
            console.log('Erro ao deletar imagem');
            
        }
        
    }

    return (
        <Container>
            <DashboardHeader />

            <div className="w-full bg-white p-3 rounded-lg flex flex-col sm:flex-row items-center gap-2">
                <button className="border-2 w-48 rounded-lg flex items-center justify-center cursor-pointer border-gray-600 h-32 md:w-48">
                    <div className="absolute cursor-pointer">
                        <FiUpload size={30} color="#000" />
                    </div>
                    <div className="cursor-pointer">
                        <input type="file" accept="image/*" className="opacity-0 cursor-pointer" onChange={handleFile} />
                    </div>
                </button>
                {carImages.map((item) => (
                    <div key={item.name} className="w-full h-32 flex items-center justify-center relative">
                        <button className="absolute" onClick={() => handleDeleteImage(item)}>
                            <FiTrash size={28} color='#fff'/>
                        </button>
                        <img src={item.previewUrl} className="rounded-lg w-full h-32 object-cover" alt="Foto do carro"/>
                    </div>
                ))}
            </div>

            <div className="w-full bg-white p-3 rounded-lg flex flex-col sm:flex-row items-center gap-2 mt-2">
                <form className="w-full" onSubmit={handleSubmit(onSubmit)}>
                    <div className="mb-3">
                        <p className="mb-2 font-medium">Nome do carro</p>
                        <Input
                            type="text"
                            register={register}
                            name="name"
                            error={errors.name?.message}
                            placeholder="Ex: Onix 1.0..."
                        />
                    </div>

                    <div className="mb-3">
                        <p className="mb-2 font-medium">Modelo do carro</p>
                        <Input
                            type="text"
                            register={register}
                            name="model"
                            error={errors.model?.message}
                            placeholder="Ex: 1.0 Flex PLUS MANUAL..."
                        />
                    </div>

                    <div className="flex w-full mb-3 flex-row items-center gap-3">
                        <div className="w-full">
                            <p className="mb-2 font-medium">Ano</p>
                            <Input
                                type="text"
                                register={register}
                                name="year"
                                error={errors.year?.message}
                                placeholder="Ex: 2016/2016..."
                            />
                        </div>
                        <div className="w-full">
                            <p className="mb-2 font-medium">KM rodados</p>
                            <Input
                                type="text"
                                register={register}
                                name="km"
                                error={errors.km?.message}
                                placeholder="Ex: 19.500..."
                            />
                        </div>
                    </div>

                    <div className="flex w-full mb-3 flex-row items-center gap-3">
                        <div className="w-full">
                            <p className="mb-2 font-medium">Telefone / Whatsapp</p>
                            <Input
                                type="text"
                                register={register}
                                name="whatsapp"
                                error={errors.whatsapp?.message}
                                placeholder="Ex: 011999999999..."
                            />
                        </div>
                        <div className="w-full">
                            <p className="mb-2 font-medium">Cidade</p>
                            <Input
                                type="text"
                                register={register}
                                name="city"
                                error={errors.city?.message}
                                placeholder="Ex: Campo Grande - MS..."
                            />
                        </div>
                    </div>

                    <div className="mb-3">
                        <p className="mb-2 font-medium">Preço</p>
                        <Input
                            type="text"
                            register={register}
                            name="price"
                            error={errors.price?.message}
                            placeholder="Ex: Onix 1.0..."
                        />
                    </div>

                    <div className="mb-3">
                        <p className="mb-2 font-medium">Descrição</p>
                        <textarea
                            className="border-2 w-full rounded-md h-24 px-2"
                            {...register('description')}
                            name="description"
                            id="description"
                            placeholder="Digite a descrição completa sobre o carro..."
                        />
                        {errors.description && <p className="mb-1 text-red-500">{errors.description.message}</p>}
                    </div>

                    <button type="submit" className="rounded-md bg-zinc-900 text-white font-medium w-full h-10">Cadastrar</button>
                </form>
            </div>
        </Container>
    )
}